import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
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

// GET public blogs, admin can optionally see all via admin token
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const published = searchParams.get('published');
    const limit = parseInt(searchParams.get('limit') || '20');

    const token = getTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;
    const isAdmin = payload?.role === 'admin';

    const query: Record<string, any> = {};
    if (!isAdmin) {
      query.isPublished = true;
    } else if (published === 'true') {
      query.isPublished = true;
    } else if (published === 'false') {
      query.isPublished = false;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    const blogs = await Blog.find(query).sort({ featured: -1, createdAt: -1 }).limit(limit);
    const total = await Blog.countDocuments(query);

    return createSuccessResponse({ blogs, total });
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
      featured,
      isPublished,
      readTime: Number.isNaN(readTime) ? 5 : readTime,
    });

    return createSuccessResponse({ message: 'Blog created successfully', blog }, 201);
  } catch (error: any) {
    console.error('Create blog error:', error);
    return createErrorResponse(error.message || 'Failed to create blog', 500);
  }
}