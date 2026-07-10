import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
import BlogCategory from '@/lib/models/BlogCategory';
import BlogTag from '@/lib/models/BlogTag';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function ensureUniqueSlug(baseSlug: string, currentId?: string) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await Blog.findOne({ slug, ...(currentId ? { _id: { $ne: currentId } } : {}) }).select('_id');
    if (!existing) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

// GET blogs with advanced filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '12'));
    const skip = (page - 1) * limit;

    const featured = searchParams.get('featured');
    const published = searchParams.get('published');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'latest';

    const token = getTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;
    const isAdmin = payload?.role === 'admin';

    const query: Record<string, any> = {};

    // Access control
    if (!isAdmin) {
      query.isPublished = true;
      query.publishedAt = { $lte: new Date() };
    } else if (published === 'true') {
      query.isPublished = true;
    } else if (published === 'false') {
      query.isPublished = false;
    }

    // Feature filter
    if (featured === 'true') {
      query.featured = true;
    }

    // Category filter
    if (category) {
      const categoryDoc = await BlogCategory.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // Tag filter
    if (tag) {
      const tagDoc = await BlogTag.findOne({ slug: tag });
      if (tagDoc) {
        query.tags = { $in: [tagDoc._id] };
      }
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    let sort: Record<string, 1 | -1> = { featured: -1, createdAt: -1 };
    switch (sortBy) {
      case 'views':
        sort = { views: -1, createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'trending':
        sort = { views: -1, featured: -1, createdAt: -1 };
        break;
      case 'latest':
      default:
        sort = { featured: -1, createdAt: -1 };
    }

    const blogs = await Blog.find(query)
      .populate('category', 'name slug')
      .populate('tags', 'name slug color')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-content');

    const total = await Blog.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return createSuccessResponse(
      {
        blogs,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasMore: page < pages,
        },
      },
      200
    );
  } catch (error: any) {
    console.error('Get blogs error:', error);
    return createErrorResponse(error.message || 'Failed to fetch blogs', 500);
  }
}

// POST create blog (admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can create blogs', 403);
    }

    const body = await request.json();
    const title = String(body.title || '').trim();
    const excerpt = String(body.excerpt || '').trim();
    const content = String(body.content || '').trim();
    const coverImage = String(body.coverImage || '').trim();
    const author = String(body.author || 'Neoblue Team').trim();
    const slugInput = String(body.slug || '').trim();
    const category = body.category || null;
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const keywords = Array.isArray(body.keywords)
      ? body.keywords
      : String(body.keywords || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
    const galleryImages = Array.isArray(body.galleryImages) ? body.galleryImages.filter(Boolean) : [];
    const featured = Boolean(body.featured);
    const isPublished = body.isPublished !== false;
    const readTime = Number(body.readTime || 5);
    const seoTitle = String(body.seoTitle || title).trim();
    const seoDescription = String(body.seoDescription || excerpt).trim();
    const seoImage = String(body.seoImage || coverImage).trim();
    const publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();

    if (!title || !excerpt || !content || !coverImage) {
      return createErrorResponse('Please provide title, excerpt, content, and cover image', 400);
    }

    const baseSlug = slugify(slugInput || title);
    const slug = await ensureUniqueSlug(baseSlug);

    const blog = await Blog.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      galleryImages,
      keywords,
      author,
      category,
      tags,
      featured,
      isPublished,
      publishedAt,
      readTime: Number.isNaN(readTime) ? 5 : readTime,
      seoTitle,
      seoDescription,
      seoImage,
    });

    // Update category blogs count
    if (category) {
      await BlogCategory.findByIdAndUpdate(category, { $inc: { blogsCount: 1 } });
    }

    // Update tags blogs count
    if (tags.length > 0) {
      await BlogTag.updateMany({ _id: { $in: tags } }, { $inc: { blogsCount: 1 } });
    }

    const populatedBlog = await blog.populate(['category', 'tags']);

    return createSuccessResponse({ message: 'Blog created successfully', blog: populatedBlog }, 201);
  } catch (error: any) {
    console.error('Create blog error:', error);
    return createErrorResponse(error.message || 'Failed to create blog', 500);
  }
}