import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, phone, address, city, state, pincode, logo } = await request.json();

    if (!name || !email || !password || !phone || !address || !city || !state || !pincode) {
      return createErrorResponse('Please provide all required fields', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return createErrorResponse('Email already registered', 409);
    }

    // generate a slug for the vendor storefront
    const baseSlug = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSuffix = Date.now().toString(36).slice(-5);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const vendor = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      logo: logo || '',
      slug,
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
