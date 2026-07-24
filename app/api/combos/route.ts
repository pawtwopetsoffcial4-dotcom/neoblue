import { connectDB } from '@/lib/db';
import Combo from '@/lib/models/Combo';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET all active combos (public) — admin sees all
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const adminAll = searchParams.get('adminAll');

    const token = getTokenFromRequest(request);
    let isAdmin = false;
    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload?.role === 'admin') isAdmin = true;
      } catch {}
    }

    const query: any = {};
    if (!isAdmin || !adminAll) {
      query.isActive = true;
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }

    const combos = await Combo.find(query)
      .populate('products.productId', 'title price images category waterType vendorId')
      .sort({ isFeatured: -1, createdAt: -1 });

    return createSuccessResponse({ combos });
  } catch (error: any) {
    console.error('Get combos error:', error);
    return createErrorResponse(error.message || 'Failed to fetch combos', 500);
  }
}

// POST create combo (admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can create combos', 403);
    }

    const {
      name,
      description,
      products,
      price,
      originalPrice,
      coverImage,
      images,
      isActive,
      isFeatured,
      tag,
      shippingCharge,
    } = await request.json();

    if (!name || !description || price == null || !coverImage) {
      return createErrorResponse('Please provide name, description, price, and coverImage', 400);
    }

    if (!Array.isArray(products) || products.length < 2) {
      return createErrorResponse('A combo must have at least 2 products', 400);
    }

    for (const p of products) {
      if (!p.productId || !p.quantity || Number(p.quantity) < 1) {
        return createErrorResponse('Each product entry must have productId and quantity >= 1', 400);
      }
    }

    const combo = await Combo.create({
      name: name.trim(),
      description: description.trim(),
      products,
      price: Number(price),
      originalPrice: originalPrice != null ? Number(originalPrice) : undefined,
      coverImage,
      images: Array.isArray(images) ? images : [],
      isActive: isActive !== false,
      isFeatured: isFeatured === true,
      tag: tag || '',
      shippingCharge: shippingCharge != null ? Number(shippingCharge) : 0,
    });

    const populated = await combo.populate('products.productId', 'title price images category waterType vendorId');

    return createSuccessResponse({ message: 'Combo created successfully', combo: populated }, 201);
  } catch (error: any) {
    console.error('Create combo error:', error);
    return createErrorResponse(error.message || 'Failed to create combo', 500);
  }
}
