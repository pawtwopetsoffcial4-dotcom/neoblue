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
      phone: authed.user.phone || '',
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
    if (body?.phone) {
      authed.user.phone = body.phone;
    }
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

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const authed = await getAuthedUser(request);
    if (!authed) {
      return createErrorResponse('Invalid token', 401);
    }

    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) {
      return createErrorResponse('Address id is required for update', 400);
    }

    const existingAddresses = Array.isArray(authed.user.addresses) ? authed.user.addresses : [];
    const idx = existingAddresses.findIndex((a: any) => String(a._id) === id);
    if (idx === -1) {
      return createErrorResponse('Address not found', 404);
    }

    const street = String(body?.street || existingAddresses[idx].street || '').trim();
    const city = String(body?.city || existingAddresses[idx].city || '').trim();
    const state = String(body?.state || existingAddresses[idx].state || '').trim();
    const zipcode = String(body?.zipcode || existingAddresses[idx].zipcode || '').trim();
    const isDefault = body?.isDefault !== undefined ? Boolean(body.isDefault) : Boolean(existingAddresses[idx].isDefault);

    if (!street || !city || !state || !zipcode) {
      return createErrorResponse('Please provide a complete address', 400);
    }

    // Update fields
    existingAddresses[idx].street = street;
    existingAddresses[idx].city = city;
    existingAddresses[idx].state = state;
    existingAddresses[idx].zipcode = zipcode;

    if (isDefault) {
      for (let i = 0; i < existingAddresses.length; i++) {
        existingAddresses[i].isDefault = false;
      }
      existingAddresses[idx].isDefault = true;
    }

    authed.user.addresses = existingAddresses;
    if (body?.phone) {
      authed.user.phone = body.phone;
    }
    await authed.user.save();

    return createSuccessResponse({
      message: 'Address updated successfully',
      defaultAddress: existingAddresses.find((a: any) => a.isDefault) || null,
      addresses: existingAddresses,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to update address', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const authed = await getAuthedUser(request);
    if (!authed) {
      return createErrorResponse('Invalid token', 401);
    }

    // read id from query params
    const url = new URL(request.url);
    const id = String(url.searchParams.get('id') || '').trim();
    if (!id) {
      return createErrorResponse('Address id is required for deletion', 400);
    }

    const existingAddresses = Array.isArray(authed.user.addresses) ? authed.user.addresses : [];
    const nextAddresses = existingAddresses.filter((a: any) => String(a._id) !== id);

    // If removed address was default, set first as default
    if (nextAddresses.length > 0 && !nextAddresses.some((a: any) => a.isDefault)) {
      nextAddresses[0].isDefault = true;
    }

    authed.user.addresses = nextAddresses;
    await authed.user.save();

    return createSuccessResponse({
      message: 'Address deleted',
      defaultAddress: nextAddresses.find((a: any) => a.isDefault) || null,
      addresses: nextAddresses,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to delete address', 500);
  }
}