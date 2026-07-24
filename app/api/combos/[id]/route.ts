import { connectDB } from '@/lib/db';
import Combo from '@/lib/models/Combo';
import mongoose from 'mongoose';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// GET single combo (public)
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid combo ID', 400);
    }

    const combo = await Combo.findById(id).populate(
      'products.productId',
      'title price images category waterType scientific vendorId inStock approvalStatus'
    );

    if (!combo) return createErrorResponse('Combo not found', 404);

    return createSuccessResponse({ combo });
  } catch (error: any) {
    console.error('Get combo error:', error);
    return createErrorResponse(error.message || 'Failed to fetch combo', 500);
  }
}

// PUT update combo (admin only)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can update combos', 403);
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid combo ID', 400);
    }

    const body = await request.json();

    // Validate products if provided
    if (body.products !== undefined) {
      if (!Array.isArray(body.products) || body.products.length < 2) {
        return createErrorResponse('A combo must have at least 2 products', 400);
      }
      for (const p of body.products) {
        if (!p.productId || !p.quantity || Number(p.quantity) < 1) {
          return createErrorResponse('Each product entry must have productId and quantity >= 1', 400);
        }
      }
    }

    const updatedCombo = await Combo.findByIdAndUpdate(
      id,
      {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.products !== undefined && { products: body.products }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.originalPrice !== undefined && { originalPrice: body.originalPrice != null ? Number(body.originalPrice) : undefined }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
        ...(body.images !== undefined && { images: Array.isArray(body.images) ? body.images : [] }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.tag !== undefined && { tag: body.tag }),
        ...(body.shippingCharge !== undefined && { shippingCharge: Number(body.shippingCharge) }),
      },
      { new: true, runValidators: true }
    ).populate('products.productId', 'title price images category waterType vendorId');

    if (!updatedCombo) return createErrorResponse('Combo not found', 404);

    return createSuccessResponse({ message: 'Combo updated successfully', combo: updatedCombo });
  } catch (error: any) {
    console.error('Update combo error:', error);
    return createErrorResponse(error.message || 'Failed to update combo', 500);
  }
}

// DELETE combo (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can delete combos', 403);
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid combo ID', 400);
    }

    const deleted = await Combo.findByIdAndDelete(id);
    if (!deleted) return createErrorResponse('Combo not found', 404);

    return createSuccessResponse({ message: 'Combo deleted successfully' });
  } catch (error: any) {
    console.error('Delete combo error:', error);
    return createErrorResponse(error.message || 'Failed to delete combo', 500);
  }
}
