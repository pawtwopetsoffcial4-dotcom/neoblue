import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, phone } = await request.json();

    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);

    if (!normalizedName) {
      return createErrorResponse('Please enter your full name', 400);
    }

    if (!normalizedEmail || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(normalizedEmail)) {
      return createErrorResponse('Please enter a valid email address', 400);
    }

    if (!normalizedPhone || normalizedPhone.length < 10) {
      return createErrorResponse('Please enter a valid 10-digit mobile number', 400);
    }

    // Look for existing user by email or phone
    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
        { phone: `+91${normalizedPhone}` },
        { phone: `91${normalizedPhone}` }
      ] 
    });

    if (!user) {
      // Create new customer account with random secure password
      const randomPassword = crypto.randomBytes(16).toString('hex') + '!Aa1';
      user = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password: randomPassword,
        role: 'user',
        isApproved: true,
      });
    } else {
      // Update missing phone or name if user is a standard customer
      if (user.role === 'user') {
        let needsSave = false;
        if (!user.phone) {
          user.phone = normalizedPhone;
          needsSave = true;
        }
        if (needsSave) {
          await user.save();
        }
      }
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return createSuccessResponse(
      {
        message: 'Account verified successfully',
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || normalizedPhone,
          role: user.role,
          isApproved: user.isApproved,
        },
      },
      200
    );
  } catch (error: any) {
    console.error('Cart quick auth error:', error);
    return createErrorResponse(error.message || 'Authentication failed', 500);
  }
}
