import { NextRequest } from 'next/server';
import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

// GET admin data: ?type=orders | users | all
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const isAdmin = payload?.role === 'admin';
    const isEmployeeViewingOrders = payload?.role === 'employee' && type === 'orders';

    if (!payload || (!isAdmin && !isEmployeeViewingOrders)) {
      return createErrorResponse('Forbidden', 403);
    }

    await connectDB();

    if (type === 'orders') {
      const orders = await Order.find({ status: { $ne: 'pending' } })
        .populate('userId', 'name email role')
        .populate('vendorId', 'name email')
        .populate('products.productId', 'title price images')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(4000);

      return createSuccessResponse({ orders });
    }

    if (type === 'users') {
      const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(4000);

      return createSuccessResponse({ users });
    }

    const [orders, users] = await Promise.all([
      Order.find({ status: { $ne: 'pending' } })
        .populate('userId', 'name email role')
        .populate('vendorId', 'name email')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(4000),
      User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(4000),
    ]);

    return createSuccessResponse({ orders, users });
  } catch (error: any) {
    const isConn =
      error?.code === 'DB_CONNECTIVITY_UNAVAILABLE' ||
      error?.code === 'DB_CONNECTIVITY_TIMEOUT' ||
      isDatabaseConnectivityError(error);
    return createErrorResponse(error.message || 'Failed to fetch admin data', isConn ? 503 : 500);
  }
}
