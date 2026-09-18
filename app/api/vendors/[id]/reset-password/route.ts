import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

// POST reset vendor password (admin only)
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'employee')) {
      return createErrorResponse('Forbidden: Admin access required', 403);
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid vendor ID', 400);
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return createErrorResponse('Password must be at least 6 characters long', 400);
    }

    const vendor = await User.findOne({ _id: id, role: 'vendor' });
    if (!vendor) {
      return createErrorResponse('Vendor not found', 404);
    }

    vendor.password = newPassword.trim();
    await vendor.save();

    return createSuccessResponse({
      message: `Password for ${vendor.name} (${vendor.email}) has been reset successfully`,
      vendorId: vendor._id,
    });
  } catch (error: any) {
    console.error('Reset vendor password error:', error);
    return createErrorResponse(error.message || 'Failed to reset vendor password', 500);
  }
}
