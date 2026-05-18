import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

type Address = {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  isDefault: boolean;
};

async function getAuthedUser(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return null;
  }

  return { user, payload };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authed = await getAuthedUser(request);
    if (!authed) {
      return createErrorResponse('Invalid token', 401);
    }

    const defaultAddress = Array.isArray(authed.user.addresses)
      ? authed.user.addresses.find((address: Address) => address.isDefault) || authed.user.addresses[0] || null
      : null;

    return createSuccessResponse({
      defaultAddress,
      addresses: Array.isArray(authed.user.addresses) ? authed.user.addresses : [],
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to load saved address', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authed = await getAuthedUser(request);
    if (!authed) {
      return createErrorResponse('Invalid token', 401);
    }

    const body = await request.json();
    const street = String(body?.street || '').trim();
    const city = String(body?.city || '').trim();
    const state = String(body?.state || '').trim();
    const zipcode = String(body?.zipcode || '').trim();

    if (!street || !city || !state || !zipcode) {
      return createErrorResponse('Please provide a complete address', 400);
    }

    const newAddress: Address = {
      street,
      city,
      state,
      zipcode,
      isDefault: body?.isDefault !== false,
    };

    const existingAddresses = Array.isArray(authed.user.addresses) ? authed.user.addresses : [];
    const nextAddresses = newAddress.isDefault
      ? [...existingAddresses.map((address: Address) => ({ ...address, isDefault: false })), newAddress]
      : [...existingAddresses, newAddress];

    authed.user.addresses = nextAddresses;
    await authed.user.save();

    return createSuccessResponse({
      message: 'Address saved successfully',
      defaultAddress: nextAddresses.find((address: Address) => address.isDefault) || newAddress,
      addresses: nextAddresses,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to save address', 500);
  }
}