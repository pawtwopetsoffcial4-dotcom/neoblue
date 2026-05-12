import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
import BlogCategory from '@/lib/models/BlogCategory';
import BlogTag from '@/lib/models/BlogTag';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function ensureUniqueSlug(baseSlug: string, currentId: string) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await Blog.findOne({ slug, _id: { $ne: currentId } }).select('_id');
    if (!existing) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;
    const token = getTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;
    const isAdmin = payload?.role === 'admin';

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { slug: id };

    const blog = await Blog.findOne(query)
      .populate('category', 'name slug description')
      .populate('tags', 'name slug color');

    if (!blog) {
      return createErrorResponse('Blog not found', 404);
    }

    if (!blog.isPublished && !isAdmin) {
      return createErrorResponse('This blog is not published', 403);
    }

    // Increment view count
    blog.views = (blog.views || 0) + 1;
    await blog.save();

    return createSuccessResponse({ blog });
  } catch (error: any) {
    console.error('Get blog error:', error);
    return createErrorResponse(error.message || 'Failed to fetch blog', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can update blogs', 403);
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid blog ID', 400);
    }

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return createErrorResponse('Blog not found', 404);
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    // Get old category and tags for count updates
    const oldCategory = existingBlog.category;
    const oldTags = existingBlog.tags || [];

    if (body.title !== undefined) {
      updateData.title = String(body.title).trim();
    }
    if (body.excerpt !== undefined) updateData.excerpt = String(body.excerpt).trim();
    if (body.content !== undefined) updateData.content = String(body.content).trim();
    if (body.coverImage !== undefined) updateData.coverImage = String(body.coverImage).trim();
    if (body.author !== undefined) updateData.author = String(body.author).trim();
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);
    if (body.isPublished !== undefined) updateData.isPublished = Boolean(body.isPublished);
    if (body.readTime !== undefined) updateData.readTime = Math.max(1, Number(body.readTime));
    if (body.seoTitle !== undefined) updateData.seoTitle = String(body.seoTitle).trim();
    if (body.seoDescription !== undefined) updateData.seoDescription = String(body.seoDescription).trim();
    if (body.seoImage !== undefined) updateData.seoImage = String(body.seoImage).trim();

    if (body.keywords !== undefined) {
      updateData.keywords = Array.isArray(body.keywords)
        ? body.keywords
        : String(body.keywords)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (body.galleryImages !== undefined) {
      updateData.galleryImages = Array.isArray(body.galleryImages) ? body.galleryImages.filter(Boolean) : [];
    }

    // Handle slug update
    if (body.slug !== undefined) {
      const slugInput = String(body.slug).trim();
      updateData.slug = await ensureUniqueSlug(slugify(slugInput || String(body.title || existingBlog.title)), id);
    } else if (body.title !== undefined) {
      // Auto-update slug if title changes but slug not specified
      const baseSlug = slugify(body.title);
      updateData.slug = await ensureUniqueSlug(baseSlug, id);
    }

    // Handle category update with count adjustments
    if (body.category !== undefined) {
      const newCategory = body.category;
      updateData.category = newCategory;

      if (oldCategory && oldCategory.toString() !== newCategory) {
        await BlogCategory.findByIdAndUpdate(oldCategory, { $inc: { blogsCount: -1 } });
      }
      if (newCategory && (!oldCategory || oldCategory.toString() !== newCategory)) {
        await BlogCategory.findByIdAndUpdate(newCategory, { $inc: { blogsCount: 1 } });
      }
    }

    // Handle tags update with count adjustments
    if (body.tags !== undefined) {
      const newTags = Array.isArray(body.tags) ? body.tags : [];
      const tagsToAdd = newTags.filter((t: string) => !oldTags.includes(t));
      const tagsToRemove = oldTags.filter((t: any) => !newTags.includes(t.toString()));

      if (tagsToAdd.length > 0) {
        await BlogTag.updateMany({ _id: { $in: tagsToAdd } }, { $inc: { blogsCount: 1 } });
      }
      if (tagsToRemove.length > 0) {
        await BlogTag.updateMany({ _id: { $in: tagsToRemove } }, { $inc: { blogsCount: -1 } });
      }

      updateData.tags = newTags;
    }

    const blog = await Blog.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('category', 'name slug')
      .populate('tags', 'name slug color');

    return createSuccessResponse({ message: 'Blog updated successfully', blog });
  } catch (error: any) {
    console.error('Update blog error:', error);
    return createErrorResponse(error.message || 'Failed to update blog', 500);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can delete blogs', 403);
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid blog ID', 400);
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return createErrorResponse('Blog not found', 404);
    }

    // Update category count
    if (blog.category) {
      await BlogCategory.findByIdAndUpdate(blog.category, { $inc: { blogsCount: -1 } });
    }

    // Update tags count
    if (blog.tags && blog.tags.length > 0) {
      await BlogTag.updateMany({ _id: { $in: blog.tags } }, { $inc: { blogsCount: -1 } });
    }

    await Blog.findByIdAndDelete(id);

    return createSuccessResponse({ message: 'Blog deleted successfully' });
  } catch (error: any) {
    console.error('Delete blog error:', error);
    return createErrorResponse(error.message || 'Failed to delete blog', 500);
  }
}