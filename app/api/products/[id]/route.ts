import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { normalizeShippingRate } from '@/lib/utils/shipping';
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

    const product = await Product.findById(id).populate('vendorId', 'name email slug logo shippingRatesSouth shippingRatesNorth nonServiceableStates addresses');

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
    const hasPerPieceKey = 'perPiecePrice' in updateData;
    const hasPerPairKey = 'perPairPrice' in updateData;
    const hasShippingChargeKey = 'shippingCharge' in updateData;

    if ('stockQuantity' in updateData) {
      const stock = Number(updateData.stockQuantity);
      if (isNaN(stock) || stock < 0) {
        return createErrorResponse('Invalid stockQuantity', 400);
      }
      if (product.stockQuantity !== stock) {
        updateData.soldAfterLastStockUpdate = 0;
      }
      updateData.stockQuantity = stock;
      updateData.inStock = stock > 0;
    }

    if ('soldQuantity' in updateData) {
      const sold = Number(updateData.soldQuantity);
      if (isNaN(sold) || sold < 0) {
        return createErrorResponse('Invalid soldQuantity', 400);
      }
      updateData.soldQuantity = sold;
    }

    if ('weightPerPiece' in updateData) {
      const weight = Number(updateData.weightPerPiece);
      if (isNaN(weight) || weight < 0) {
        return createErrorResponse('Invalid weightPerPiece', 400);
      }
      updateData.weightPerPiece = weight;
    }

    if ('shippingType' in updateData) {
      updateData.shippingType = updateData.shippingType === 'weight' ? 'weight' : 'piece';
    }

    if (hasShippingChargeKey) {
      const nextShippingCharge = updateData.shippingCharge == null ? 0 : normalizeShippingRate(updateData.shippingCharge);
      if (isNaN(nextShippingCharge) || nextShippingCharge < 0) {
        return createErrorResponse('Invalid shippingCharge', 400);
      }
      updateData.shippingCharge = nextShippingCharge;
    }

    if (hasPerPieceKey || hasPerPairKey) {
      const nextPerPiece = hasPerPieceKey
        ? (updateData.perPiecePrice == null ? undefined : Number(updateData.perPiecePrice))
        : (product.perPiecePrice == null ? undefined : Number(product.perPiecePrice));
      const nextPerPair = hasPerPairKey
        ? (updateData.perPairPrice == null ? undefined : Number(updateData.perPairPrice))
        : (product.perPairPrice == null ? undefined : Number(product.perPairPrice));

      if (nextPerPiece != null && (isNaN(nextPerPiece) || nextPerPiece < 0)) {
        return createErrorResponse('Invalid perPiecePrice', 400);
      }

      if (nextPerPair != null && (isNaN(nextPerPair) || nextPerPair < 0)) {
        return createErrorResponse('Invalid perPairPrice', 400);
      }

      const hasPerPiece = nextPerPiece != null;
      const hasPerPair = nextPerPair != null;
      if (hasPerPiece === hasPerPair) {
        return createErrorResponse('Provide exactly one unit price: perPiecePrice or perPairPrice', 400);
      }

      updateData.perPiecePrice = hasPerPiece ? nextPerPiece : null;
      updateData.perPairPrice = hasPerPair ? nextPerPair : null;
    } else if ('price' in updateData) {
      const nextPrice = Number(updateData.price);
      if (!isNaN(nextPrice) && nextPrice >= 0) {
        if (product.perPairPrice != null) {
          updateData.perPairPrice = nextPrice;
          updateData.perPiecePrice = null;
        } else {
          updateData.perPiecePrice = nextPrice;
          updateData.perPairPrice = null;
        }
      }
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
