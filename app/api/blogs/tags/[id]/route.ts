import { connectDB } from '@/lib/db';
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

// GET single tag
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const tag = await BlogTag.findById(id);
    if (!tag) {
      return createErrorResponse('Tag not found', 404);
    }

    return createSuccessResponse({ tag });
  } catch (error: any) {
    console.error('Get tag error:', error);
    return createErrorResponse(error.message || 'Failed to fetch tag', 500);
  }
}

// PATCH update tag (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can update tags', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid tag ID', 400);
    }

    const tag = await BlogTag.findById(id);
    if (!tag) {
      return createErrorResponse('Tag not found', 404);
    }

    const body = await request.json();

    if (body.name !== undefined) {
      tag.name = body.name;
    }
    if (body.color !== undefined) {
      tag.color = body.color;
    }
    if (body.isActive !== undefined) {
      tag.isActive = body.isActive;
    }
    if (body.seoTitle !== undefined) {
      tag.seoTitle = body.seoTitle;
    }
    if (body.seoDescription !== undefined) {
      tag.seoDescription = body.seoDescription;
    }

    if (body.slug !== undefined) {
      const baseSlug = slugify(body.slug || tag.name);
      const existing = await BlogTag.findOne({ slug: baseSlug, _id: { $ne: id } });
      if (existing) {
        return createErrorResponse('Slug already in use', 409);
      }
      tag.slug = baseSlug;
    } else if (body.name !== undefined) {
      const baseSlug = slugify(body.name);
      const existing = await BlogTag.findOne({ slug: baseSlug, _id: { $ne: id } });
      if (existing) {
        return createErrorResponse('Slug already in use', 409);
      }
      tag.slug = baseSlug;
    }

    await tag.save();
    return createSuccessResponse({ message: 'Tag updated successfully', tag });
  } catch (error: any) {
    console.error('Update tag error:', error);
    return createErrorResponse(error.message || 'Failed to update tag', 500);
  }
}

// DELETE tag (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can delete tags', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid tag ID', 400);
    }

    const tag = await BlogTag.findById(id);
    if (!tag) {
      return createErrorResponse('Tag not found', 404);
    }

    await BlogTag.findByIdAndDelete(id);
    return createSuccessResponse({ message: 'Tag deleted successfully' });
  } catch (error: any) {
    console.error('Delete tag error:', error);
    return createErrorResponse(error.message || 'Failed to delete tag', 500);
  }
}
