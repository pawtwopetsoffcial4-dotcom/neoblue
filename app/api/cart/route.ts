import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Cart from '@/lib/models/Cart';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) {
      return createSuccessResponse({ items: [] });
    }

    const formattedItems = cart.items
      .filter((item: any) => item.productId) // filter out deleted products
      .map((item: any) => ({
        productId: item.productId._id.toString(),
        title: item.productId.title,
        price: item.productId.price,
        image: item.productId.images?.[0] ?? '/api/placeholder/400/300',
        quantity: item.quantity,
      }));

    return createSuccessResponse({ items: formattedItems });
  } catch (error: any) {
    console.error('Fetch cart error:', error);
    return createErrorResponse(error.message || 'Failed to fetch cart', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const itemsInput = Array.isArray(body.items) ? body.items : [];

    // Filter and sanitize input items
    const sanitizedItems = itemsInput
      .filter((item: any) => item && typeof item.productId === 'string' && typeof item.quantity === 'number')
      .map((item: any) => ({
        productId: item.productId,
        quantity: Math.max(1, Math.floor(item.quantity)),
      }));

    // Update or insert the cart
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items: sanitizedItems },
      { new: true, upsert: true }
    ).populate('items.productId');

    const formattedItems = cart.items
      .filter((item: any) => item.productId) // filter out deleted products
      .map((item: any) => ({
        productId: item.productId._id.toString(),
        title: item.productId.title,
        price: item.productId.price,
        image: item.productId.images?.[0] ?? '/api/placeholder/400/300',
        quantity: item.quantity,
      }));

    return createSuccessResponse({ items: formattedItems });
  } catch (error: any) {
    console.error('Update cart error:', error);
    return createErrorResponse(error.message || 'Failed to update cart', 500);
  }
}
