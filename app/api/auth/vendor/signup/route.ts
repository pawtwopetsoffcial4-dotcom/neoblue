import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, phone, address, city, state, pincode } = await request.json();

    if (!name || !email || !password || !phone || !address || !city || !state || !pincode) {
      return createErrorResponse('Please provide all required fields', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return createErrorResponse('Email already registered', 409);
    }

    const vendor = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'vendor',
      isApproved: false,
      addresses: [
        {
          street: address,
          city,
          state,
          zipcode: pincode,
          isDefault: true,
        },
      ],
    });

    return createSuccessResponse(
      {
        message: 'Vendor registration submitted. Wait for admin approval before login.',
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.addresses?.[0] ?? null,
          role: vendor.role,
          isApproved: vendor.isApproved,
        },
      },
      201
    );
  } catch (error: any) {
    return createErrorResponse(error.message || 'Vendor signup failed', 500);
  }
}
