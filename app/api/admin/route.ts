import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

// GET admin data: ?type=orders | users | all
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Forbidden', 403);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    if (type === 'orders') {
      const orders = await Order.find({})
        .populate('userId', 'name email role')
        .populate('vendorId', 'name email')
        .populate('products.productId', 'title price')
        .sort({ createdAt: -1 });

      return createSuccessResponse({ orders });
    }

    if (type === 'users') {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      return createSuccessResponse({ users });
    }

    const [orders, users] = await Promise.all([
      Order.find({})
        .populate('userId', 'name email role')
        .populate('vendorId', 'name email')
        .sort({ createdAt: -1 }),
      User.find({}).select('-password').sort({ createdAt: -1 }),
    ]);

    return createSuccessResponse({ orders, users });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to fetch admin data', 500);
  }
}
