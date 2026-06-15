import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, name, uid, role } = await request.json();

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();
    const targetRole = role === 'vendor' ? 'vendor' : 'user';

    if (!normalizedEmail) {
      return createErrorResponse('Please provide email address from provider', 400);
    }

    // Find user by email
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Register a new user with a random secure password
      const placeholderPassword = crypto.randomBytes(24).toString('hex');
      user = await User.create({
        name: normalizedName || 'Social User',
        email: normalizedEmail,
        password: placeholderPassword,
        role: targetRole,
        isApproved: false,
      });
    }

    // Vendors must be approved to login (if their email is tied to a vendor account)
    if (user.role === 'vendor' && !user.isApproved) {
      return createErrorResponse('Vendor account associated with this email is not approved yet', 403);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return createSuccessResponse(
      {
        message: 'Social login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
        },
      },
      200
    );
  } catch (error: any) {
    console.error('Social login error:', error);
    return createErrorResponse(error.message || 'Social login failed', 500);
  }
}
