import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

// PATCH approve/reject vendor (admin only)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid vendor ID', 400);
    }

    const { action } = await request.json();
    if (!['approve', 'reject'].includes(action)) {
      return createErrorResponse('Invalid action', 400);
    }

    const vendor = await User.findOne({ _id: id, role: 'vendor' });
    if (!vendor) {
      return createErrorResponse('Vendor not found', 404);
    }

    vendor.isApproved = action === 'approve';
    await vendor.save();

    return createSuccessResponse({
      message: `Vendor ${action}d successfully`,
      vendor,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to update vendor', 500);
  }
}

// PUT update vendor shipping settings (admin only)
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid vendor ID', 400);
    }

    const { shippingRatesSouth, shippingRatesNorth, nonServiceableStates, deliverNorth, deliverSouth } = await request.json();

    const vendor = await User.findOne({ _id: id, role: 'vendor' });
    if (!vendor) {
      return createErrorResponse('Vendor not found', 404);
    }

    if (shippingRatesSouth !== undefined) vendor.shippingRatesSouth = shippingRatesSouth;
    if (shippingRatesNorth !== undefined) vendor.shippingRatesNorth = shippingRatesNorth;
    if (nonServiceableStates !== undefined) vendor.nonServiceableStates = nonServiceableStates;
    if (deliverNorth !== undefined) vendor.deliverNorth = deliverNorth;
    if (deliverSouth !== undefined) vendor.deliverSouth = deliverSouth;

    await vendor.save();

    return createSuccessResponse({
      message: 'Vendor shipping settings updated successfully',
      vendor,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to update shipping settings', 500);
  }
}
