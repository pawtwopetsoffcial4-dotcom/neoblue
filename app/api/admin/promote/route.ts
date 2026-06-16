import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

// POST promote or demote user/vendor admin role by email or userId
export async function POST(request: NextRequest) {
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

    const { email, userId, action = 'promote' } = await request.json();

    if (!email && !userId) {
      return createErrorResponse('Provide email or userId', 400);
    }

    if (action !== 'promote' && action !== 'demote') {
      return createErrorResponse('Invalid action', 400);
    }

    let user = null;

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      user = await User.findOne({ email: normalizedEmail });
    } else if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return createErrorResponse('Invalid userId', 400);
      }
      user = await User.findById(userId);
    }

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if (action === 'demote' && user._id.toString() === payload.userId) {
      return createErrorResponse('You cannot remove your own admin access', 400);
    }

    if (action === 'promote' && user.role === 'admin') {
      return createSuccessResponse({
        message: 'User is already an admin',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    }

    if (action === 'promote') {
      user.role = 'admin';
      user.isApproved = true;
    } else {
      user.role = 'user';
      user.isApproved = true;
    }
    await user.save();

    return createSuccessResponse({
      message: action === 'promote' ? 'User promoted to admin successfully' : 'Admin access removed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to update admin access', 500);
  }
}
