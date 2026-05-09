import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';

// GET single product
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid product ID', 400);
    }

    const product = await Product.findById(id).populate('vendorId', 'name email');

    if (!product) {
      return createErrorResponse('Product not found', 404);
    }

    return createSuccessResponse({ product });
  } catch (error: any) {
    console.error('Get product error:', error);
    return createErrorResponse(error.message || 'Failed to fetch product', 500);
  }
}

// PUT/PATCH update product (vendor owner or admin)
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;

    // Check authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'vendor' && payload.role !== 'admin')) {
      return createErrorResponse('Only vendors or admins can update products', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid product ID', 400);
    }

    // Check if product belongs to vendor
    const product = await Product.findById(id);
    if (!product) {
      return createErrorResponse('Product not found', 404);
    }

    if (payload.role === 'vendor' && product.vendorId.toString() !== payload.userId) {
      return createErrorResponse('You can only update your own products', 403);
    }

    const updateData = await request.json();
    if ('perPiecePrice' in updateData && updateData.perPiecePrice != null) {
      updateData.perPiecePrice = Number(updateData.perPiecePrice);
    }
    if ('perPairPrice' in updateData && updateData.perPairPrice != null) {
      updateData.perPairPrice = Number(updateData.perPairPrice);
    }
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return createSuccessResponse({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return createErrorResponse(error.message || 'Failed to update product', 500);
  }
}

// DELETE product (vendor owner or admin)
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;

    // Check authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'vendor' && payload.role !== 'admin')) {
      return createErrorResponse('Only vendors or admins can delete products', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid product ID', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return createErrorResponse('Product not found', 404);
    }

    if (payload.role === 'vendor' && product.vendorId.toString() !== payload.userId) {
      return createErrorResponse('You can only delete your own products', 403);
    }

    await Product.findByIdAndDelete(id);

    return createSuccessResponse({
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return createErrorResponse(error.message || 'Failed to delete product', 500);
  }
}
