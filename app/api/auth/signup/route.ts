import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, phone } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validate input
    if (!name || !normalizedEmail || !password || !phone) {
      return createErrorResponse('Please provide all required fields', 400);
    }

    const normalizedPhone = String(phone || '').trim();
    if (normalizedPhone.length < 10) {
      return createErrorResponse('Please provide a valid phone number (at least 10 digits)', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail }).select('+password');
    if (existingUser) {
      if (existingUser.role === 'admin') {
        const isPasswordValid = await existingUser.comparePassword(password);
        if (!isPasswordValid) {
          return createErrorResponse('Invalid credentials', 401);
        }

        const adminToken = generateToken({
          userId: existingUser._id.toString(),
          email: existingUser.email,
          role: existingUser.role,
        });

        return createSuccessResponse(
          {
            message: 'Admin recognized. Logged in successfully.',
            token: adminToken,
            user: {
              id: existingUser._id,
              name: existingUser.name,
              email: existingUser.email,
              phone: existingUser.phone,
              role: existingUser.role,
              isApproved: existingUser.isApproved,
            },
          },
          200
        );
      }

      return createErrorResponse('Email already registered', 409);
    }

    // Create new user
    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      role: 'user',
      isApproved: true,
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return createSuccessResponse(
      {
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isApproved: user.isApproved,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return createErrorResponse(error.message || 'Signup failed', 500);
  }
}
