import { connectDB } from '@/lib/db';
import BlogCategory from '@/lib/models/BlogCategory';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// GET all categories
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active') !== 'false';

    const query: Record<string, any> = {};
    if (active) {
      query.isActive = true;
    }

    const categories = await BlogCategory.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('-seoTitle -seoDescription');

    return createSuccessResponse({ categories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return createErrorResponse(error.message || 'Failed to fetch categories', 500);
  }
}

// POST create category (admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can create categories', 403);
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim();
    const icon = String(body.icon || '').trim();
    const color = String(body.color || '#3B82F6').trim();
    const displayOrder = Number(body.displayOrder || 0);
    const isActive = body.isActive !== false;
    const slugInput = String(body.slug || '').trim();
    const seoTitle = String(body.seoTitle || name).trim();
    const seoDescription = String(body.seoDescription || description).trim();

    if (!name) {
      return createErrorResponse('Please provide category name', 400);
    }

    // Check if category already exists
    const existing = await BlogCategory.findOne({ name });
    if (existing) {
      return createErrorResponse('Category already exists', 409);
    }

    const baseSlug = slugify(slugInput || name);
    const category = await BlogCategory.create({
      name,
      slug: baseSlug,
      description,
      icon,
      color,
      displayOrder,
      isActive,
      seoTitle,
      seoDescription,
    });

    return createSuccessResponse({ message: 'Category created successfully', category }, 201);
  } catch (error: any) {
    console.error('Create category error:', error);
    return createErrorResponse(error.message || 'Failed to create category', 500);
  }
}
