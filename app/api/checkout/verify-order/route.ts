import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { decrementStockForOrder } from '@/lib/utils/stock';
import { createNotification } from '@/lib/utils/notifications';

const appId = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;
const cashfreeEnv = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';

const getCashfreeBaseUrl = () => (cashfreeEnv === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com');

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    if (!appId || !secretKey) {
      return createErrorResponse('Cashfree keys are not configured', 500);
    }

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'user') {
      return createErrorResponse('Only users can verify checkout orders', 403);
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return createErrorResponse('Please provide orderId', 400);
    }

    const orderRes = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      return createErrorResponse(orderData?.message || 'Failed to verify Cashfree order', orderRes.status);
    }

    let cfPaymentId: string | null = null;
    const paymentsRes = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
    });

    if (paymentsRes.ok) {
      const payments = await paymentsRes.json();
      const successPayment = Array.isArray(payments)
        ? payments.find((payment: any) => payment?.payment_status === 'SUCCESS')
        : null;
      cfPaymentId = successPayment?.cf_payment_id || null;
    }

    const isPaid = orderData.order_status === 'PAID';
    if (isPaid) {
      const ordersToUpdate = await Order.find({ cashfreeOrderId: orderId });
      for (const order of ordersToUpdate) {
        if (order.status !== 'placed') {
          order.status = 'placed';
          order.paymentId = cfPaymentId || orderId;
          await order.save();
          await decrementStockForOrder(order);

          // Trigger notification for the buyer
          await createNotification(
            order.userId,
            'Order Confirmed! 🎉',
            `Your order #${order._id.toString().toUpperCase().slice(-6)} of ₹${order.totalAmount.toFixed(2)} has been placed successfully.`,
            'order_status',
            '/orders'
          ).catch((e) => console.error('Notification buyer error:', e));

          // Trigger notification for the vendor
          await createNotification(
            order.vendorId,
            'New Order Received! 📦',
            `You have received a new order #${order._id.toString().toUpperCase().slice(-6)} for ₹${order.totalAmount.toFixed(2)}.`,
            'new_order',
            '/vendor/orders'
          ).catch((e) => console.error('Notification vendor error:', e));
        }
      }
    }

    return NextResponse.json({
      orderId,
      orderStatus: orderData.order_status,
      paymentStatus: orderData.order_status,
      cfPaymentId,
      isPaid,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to verify Cashfree order', 500);
  }
}
