import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return createErrorResponse('Please provide email and password', 400);
    }

    const user = await User.findOne({ email: normalizedEmail, role: 'vendor' }).select('+password');
    if (!user) {
      return createErrorResponse('Vendor account not found', 404);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return createErrorResponse('Invalid credentials', 401);
    }

    if (!user.isApproved) {
      return createErrorResponse('Vendor account not approved yet', 403);
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return createSuccessResponse({
      message: 'Vendor login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Vendor login failed', 500);
  }
}
