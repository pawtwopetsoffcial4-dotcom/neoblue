import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

// GET all vendors (admin only)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'employee')) {
      return createErrorResponse('Forbidden', 403);
    }

    const vendors = await User.find({ role: 'vendor' }).select('-password').sort({ createdAt: -1 });

    return createSuccessResponse({ vendors });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to fetch vendors', 500);
  }
}
