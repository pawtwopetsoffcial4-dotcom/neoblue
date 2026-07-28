import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { createNotification } from '@/lib/utils/notifications';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';

// GET single order
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;

    // Check authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return createErrorResponse('Invalid token', 401);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid order ID', 400);
    }

    const order = await Order.findById(id)
      .populate('userId', 'name email')
      .populate('vendorId', 'name email')
      .populate('products.productId', 'title price');

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // Check permission
    if (payload.role === 'user' && order.userId.toString() !== payload.userId) {
      return createErrorResponse('Unauthorized', 403);
    }

    if (payload.role === 'vendor' && order.vendorId.toString() !== payload.userId) {
      return createErrorResponse('Unauthorized', 403);
    }

    return createSuccessResponse({ order });
  } catch (error: any) {
    console.error('Get order error:', error);
    return createErrorResponse(error.message || 'Failed to fetch order', 500);
  }
}

// PATCH update order status (vendor only)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;

    // Check authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'vendor' && payload.role !== 'admin')) {
      return createErrorResponse('Only vendors and admins can update order status', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid order ID', 400);
    }

    const { status, notes, carrier, trackingNumber, trackingLink } = await request.json();

    const validStatuses = ['placed', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return createErrorResponse('Invalid status', 400);
    }

    const order = await Order.findById(id);
    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    if (payload.role === 'vendor' && order.vendorId.toString() !== payload.userId) {
      return createErrorResponse('You can only update your own orders', 403);
    }

    // Cashfree Refund Logic
    if (status === 'cancelled' && order.cashfreeOrderId && payload.role === 'admin') {
      const appId = process.env.CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY;
      const cashfreeEnv = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
      const getCashfreeBaseUrl = () => (cashfreeEnv === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com');

      if (appId && secretKey) {
        try {
          const refundRes = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${order.cashfreeOrderId}/refunds`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-client-id': appId,
              'x-client-secret': secretKey,
              'x-api-version': '2023-08-01',
            },
            body: JSON.stringify({
              refund_amount: order.totalAmount,
              refund_id: `ref_${order._id.toString()}_${Date.now()}`,
              refund_note: notes || 'Admin Cancelled Order'
            })
          });

          if (!refundRes.ok) {
            const errData = await refundRes.json();
            console.error('Cashfree refund failed:', errData);
            return createErrorResponse(`Failed to initiate refund: ${errData.message || 'Unknown error'}`, 500);
          }
        } catch (err: any) {
          console.error('Cashfree refund request failed:', err);
          return createErrorResponse('Failed to communicate with Cashfree for refund', 500);
        }
      }
    }

    if (status === 'completed' && order.status !== 'completed') {
      order.completedAt = new Date();
    }
    order.status = status;
    if (notes) order.notes = notes;
    if (carrier !== undefined) order.carrier = carrier;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (trackingLink !== undefined) order.trackingLink = trackingLink;
    
    await order.save();

    // Trigger notification for the buyer
    await createNotification(
      order.userId,
      'Order Status Updated',
      `Your order #${order._id.toString().toUpperCase().slice(-6)} status has been updated to: ${status}.`,
      'order_status',
      '/orders'
    );

    return createSuccessResponse({
      message: 'Order updated successfully',
      order,
    });
  } catch (error: any) {
    console.error('Update order error:', error);
    return createErrorResponse(error.message || 'Failed to update order', 500);
  }
}
