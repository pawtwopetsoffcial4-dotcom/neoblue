import { connectDB } from '@/lib/db';
import BlogTag from '@/lib/models/BlogTag';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// GET all tags
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active') !== 'false';

    const query: Record<string, any> = {};
    if (active) {
      query.isActive = true;
    }

    const tags = await BlogTag.find(query)
      .sort({ blogsCount: -1, createdAt: -1 });

    return createSuccessResponse({ tags });
  } catch (error: any) {
    console.error('Get tags error:', error);
    return createErrorResponse(error.message || 'Failed to fetch tags', 500);
  }
}

// POST create tag (admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can create tags', 403);
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const color = String(body.color || '#10B981').trim();
    const isActive = body.isActive !== false;
    const slugInput = String(body.slug || '').trim();
    const seoTitle = String(body.seoTitle || name).trim();
    const seoDescription = String(body.seoDescription || `Posts tagged with ${name}`).trim();

    if (!name) {
      return createErrorResponse('Please provide tag name', 400);
    }

    // Check if tag already exists
    const existing = await BlogTag.findOne({ name });
    if (existing) {
      return createErrorResponse('Tag already exists', 409);
    }

    const baseSlug = slugify(slugInput || name);
    const tag = await BlogTag.create({
      name,
      slug: baseSlug,
      color,
      isActive,
      seoTitle,
      seoDescription,
    });

    return createSuccessResponse({ message: 'Tag created successfully', tag }, 201);
  } catch (error: any) {
    console.error('Create tag error:', error);
    return createErrorResponse(error.message || 'Failed to create tag', 500);
  }
}
