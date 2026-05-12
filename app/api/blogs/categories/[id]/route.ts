import { connectDB } from '@/lib/db';
import BlogCategory from '@/lib/models/BlogCategory';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// GET single category
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const category = await BlogCategory.findById(id);
    if (!category) {
      return createErrorResponse('Category not found', 404);
    }

    return createSuccessResponse({ category });
  } catch (error: any) {
    console.error('Get category error:', error);
    return createErrorResponse(error.message || 'Failed to fetch category', 500);
  }
}

// PATCH update category (admin only)
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
      return createErrorResponse('Only admins can update categories', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid category ID', 400);
    }

    const category = await BlogCategory.findById(id);
    if (!category) {
      return createErrorResponse('Category not found', 404);
    }

    const body = await request.json();

    if (body.name !== undefined) {
      category.name = body.name;
    }
    if (body.description !== undefined) {
      category.description = body.description;
    }
    if (body.icon !== undefined) {
      category.icon = body.icon;
    }
    if (body.color !== undefined) {
      category.color = body.color;
    }
    if (body.displayOrder !== undefined) {
      category.displayOrder = body.displayOrder;
    }
    if (body.isActive !== undefined) {
      category.isActive = body.isActive;
    }
    if (body.seoTitle !== undefined) {
      category.seoTitle = body.seoTitle;
    }
    if (body.seoDescription !== undefined) {
      category.seoDescription = body.seoDescription;
    }

    if (body.slug !== undefined) {
      const baseSlug = slugify(body.slug || category.name);
      const existing = await BlogCategory.findOne({ slug: baseSlug, _id: { $ne: id } });
      if (existing) {
        return createErrorResponse('Slug already in use', 409);
      }
      category.slug = baseSlug;
    } else if (body.name !== undefined) {
      const baseSlug = slugify(body.name);
      const existing = await BlogCategory.findOne({ slug: baseSlug, _id: { $ne: id } });
      if (existing) {
        return createErrorResponse('Slug already in use', 409);
      }
      category.slug = baseSlug;
    }

    await category.save();
    return createSuccessResponse({ message: 'Category updated successfully', category });
  } catch (error: any) {
    console.error('Update category error:', error);
    return createErrorResponse(error.message || 'Failed to update category', 500);
  }
}

// DELETE category (admin only)
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
      return createErrorResponse('Only admins can delete categories', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid category ID', 400);
    }

    const category = await BlogCategory.findById(id);
    if (!category) {
      return createErrorResponse('Category not found', 404);
    }

    await BlogCategory.findByIdAndDelete(id);
    return createSuccessResponse({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return createErrorResponse(error.message || 'Failed to delete category', 500);
  }
}
