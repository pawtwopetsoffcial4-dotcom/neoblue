import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
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
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { slug: id };

    const blog = await Blog.findOne(query);
    if (!blog) {
      return createErrorResponse('Blog not found', 404);
    }

    return createSuccessResponse({ blog });
  } catch (error: any) {
    console.error('Get blog error:', error);
    return createErrorResponse(error.message || 'Failed to fetch blog', 500);
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.excerpt !== undefined) updateData.excerpt = String(body.excerpt).trim();
    if (body.content !== undefined) updateData.content = String(body.content).trim();
    if (body.coverImage !== undefined) updateData.coverImage = String(body.coverImage).trim();
    if (body.author !== undefined) updateData.author = String(body.author).trim();
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);
    if (body.isPublished !== undefined) updateData.isPublished = Boolean(body.isPublished);
    if (body.readTime !== undefined) updateData.readTime = Number(body.readTime);
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
    if (body.slug !== undefined) {
      const slugInput = String(body.slug).trim();
      updateData.slug = await ensureUniqueSlug(slugify(slugInput || String(body.title || existingBlog.title)), id);
    }

    const blog = await Blog.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

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

    await Blog.findByIdAndDelete(id);

    return createSuccessResponse({ message: 'Blog deleted successfully' });
  } catch (error: any) {
    console.error('Delete blog error:', error);
    return createErrorResponse(error.message || 'Failed to delete blog', 500);
  }
}