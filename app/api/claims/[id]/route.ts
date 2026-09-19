import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Claim from '@/lib/models/Claim';
import Order from '@/lib/models/Order';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { createNotification } from '@/lib/utils/notifications';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return createErrorResponse('Invalid token', 401);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid claim ID', 400);
    }

    // Field lists below are trimmed to what the vendor/user claim-detail UI reads.
    // Add a field here if that UI starts reading something new from claim.orderId / claim.products.productId.
    const claim = await Claim.findById(id)
      .populate('orderId', 'totalAmount')
      .populate('userId', 'name email')
      .populate('vendorId', 'name email')
      .populate('products.productId', 'title price');

    if (!claim) {
      return createErrorResponse('Claim not found', 404);
    }

    // Check permissions
    if (payload.role === 'user' && claim.userId._id.toString() !== payload.userId) {
      return createErrorResponse('Unauthorized', 403);
    }

    if (payload.role === 'vendor' && claim.vendorId._id.toString() !== payload.userId) {
      return createErrorResponse('Unauthorized', 403);
    }

    return createSuccessResponse({ claim });
  } catch (error: any) {
    console.error('Get claim details error:', error);
    return createErrorResponse(error.message || 'Failed to fetch claim details', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'vendor') {
      return createErrorResponse('Only vendors can process claims', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid claim ID', 400);
    }

    const { status, resolution, refundAmount, vendorNotes } = await request.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return createErrorResponse('Invalid status. Status must be "approved" or "rejected"', 400);
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      return createErrorResponse('Claim not found', 404);
    }

    if (claim.vendorId.toString() !== payload.userId) {
      return createErrorResponse('You can only process claims submitted to your shop', 403);
    }

    if (claim.status !== 'pending') {
      return createErrorResponse('This claim has already been processed', 400);
    }

    claim.status = status;
    claim.vendorNotes = vendorNotes || '';

    if (status === 'approved') {
      if (!resolution || !['refund', 'replacement'].includes(resolution)) {
        return createErrorResponse('Resolution must be "refund" or "replacement" for approved claims', 400);
      }

      claim.resolution = resolution;

      if (resolution === 'refund') {
        const amt = Number(refundAmount || 0);
        if (isNaN(amt) || amt < 0) {
          return createErrorResponse('Invalid refund amount', 400);
        }
        claim.refundAmount = amt;
      } else if (resolution === 'replacement') {
        // Schedule a replacement shipment: programmatically generate a new zero-amount order
        const originalOrder = await Order.findById(claim.orderId);
        if (!originalOrder) {
          return createErrorResponse('Original order not found, unable to schedule replacement', 404);
        }

        // Map claim products back into format expected by Order model
        const replacementProducts = claim.products.map((p: any) => ({
          productId: p.productId,
          quantity: p.quantity,
          price: 0, // Replacement item is free of charge
        }));

        // Create new replacement order
        const replacementOrder = await Order.create({
          userId: claim.userId,
          vendorId: claim.vendorId,
          products: replacementProducts,
          totalAmount: 0,
          shippingAmount: 0,
          address: originalOrder.address,
          status: 'placed',
          notes: `[Replacement Shipment] for Claim #${claim._id.toString().toUpperCase().slice(-6)}. Original Order: #${originalOrder._id.toString().toUpperCase().slice(-6)}`,
        });

        claim.replacementOrderId = replacementOrder._id;
      }
    }

    await claim.save();

    // Trigger notification for the buyer
    await createNotification(
      claim.userId,
      'DOA Claim Status Updated',
      `Your DOA claim for Order #${claim.orderId.toString().toUpperCase().slice(-6)} has been ${status}.`,
      'claim',
      '/profile'
    );

    return createSuccessResponse({
      message: 'Claim processed successfully',
      claim,
    });
  } catch (error: any) {
    console.error('Process claim error:', error);
    return createErrorResponse(error.message || 'Failed to process claim', 500);
  }
}
