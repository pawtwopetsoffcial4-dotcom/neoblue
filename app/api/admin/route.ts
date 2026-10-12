import { NextRequest } from 'next/server';
import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import Cart from '@/lib/models/Cart';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

import StoreConfig from '@/lib/models/StoreConfig';
import { decrementStockForOrder } from '@/lib/utils/stock';
import { syncOrderToShiprocket } from '@/lib/utils/shiprocketSync';

export const dynamic = 'force-dynamic';

const getCashfreeBaseUrl = () => (process.env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com');

// GET admin data: ?type=orders | users | all
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const isAdmin = payload?.role === 'admin';
    const isEmployeeViewingOrders = payload?.role === 'employee' && type === 'orders';

    if (!payload || (!isAdmin && !isEmployeeViewingOrders)) {
      return createErrorResponse('Forbidden', 403);
    }

    await connectDB();

    if (type === 'orders' || type === 'all') {
      // Self-heal any recent pending orders
      try {
        const checkTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // last 2 hours
        const pendingOrders = await Order.find({ status: 'pending', createdAt: { $gt: checkTime } }).limit(20);

        if (pendingOrders.length > 0) {
          const storeConfig = await StoreConfig.findOne({}).lean();
          const rzpKeyId = (storeConfig as any)?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
          const rzpKeySecret = (storeConfig as any)?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
          const cfAppId = process.env.CASHFREE_APP_ID;
          const cfSecretKey = process.env.CASHFREE_SECRET_KEY;

          // Check Razorpay
          if (rzpKeyId && rzpKeySecret) {
            const uniqueRzpIds = Array.from(new Set(pendingOrders.map(o => o.razorpayOrderId).filter(Boolean)));
            const authHeader = `Basic ${Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64')}`;
            for (const rzpId of uniqueRzpIds) {
              try {
                const rzpRes = await fetch(`https://api.razorpay.com/v1/orders/${rzpId}`, {
                  headers: { Authorization: authHeader },
                });
                if (rzpRes.ok) {
                  const rzpData = await rzpRes.json();
                  if (rzpData.status === 'paid') {
                    let rzpPaymentId = null;
                    const paymentsRes = await fetch(`https://api.razorpay.com/v1/orders/${rzpId}/payments`, {
                      headers: { Authorization: authHeader },
                    });
                    if (paymentsRes.ok) {
                      const payData = await paymentsRes.json();
                      const items = payData?.items || [];
                      const captured = items.find((p: any) => p.status === 'captured') || items[0];
                      rzpPaymentId = captured?.id || null;
                    }
                    const ordersToUpdate = await Order.find({ razorpayOrderId: rzpId });
                    for (const order of ordersToUpdate) {
                      if (order.status !== 'placed') {
                        order.status = 'placed';
                        order.paymentId = rzpPaymentId || rzpId;
                        await order.save();
                        await decrementStockForOrder(order);
                        await syncOrderToShiprocket(order);
                        await Cart.findOneAndUpdate({ userId: order.userId }, { items: [] }).catch(() => {});
                      }
                    }
                  }
                }
              } catch (e) {
                console.error(`Admin self-healing Razorpay order ${rzpId} error:`, e);
              }
            }
          }

          // Check Cashfree
          if (cfAppId && cfSecretKey) {
            const uniqueCfIds = Array.from(new Set(pendingOrders.map(o => o.cashfreeOrderId).filter(Boolean)));
            for (const cfId of uniqueCfIds) {
              try {
                const orderRes = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${cfId}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': cfAppId,
                    'x-client-secret': cfSecretKey,
                    'x-api-version': '2023-08-01',
                  },
                });
                if (orderRes.ok) {
                  const orderData = await orderRes.json();
                  if (orderData.order_status === 'PAID') {
                    const paymentsRes = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${cfId}/payments`, {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-client-id': cfAppId,
                        'x-client-secret': cfSecretKey,
                        'x-api-version': '2023-08-01',
                      },
                    });
                    let cfPaymentId = null;
                    if (paymentsRes.ok) {
                      const payments = await paymentsRes.json();
                      const successPayment = Array.isArray(payments) ? payments.find((p: any) => p?.payment_status === 'SUCCESS') : null;
                      cfPaymentId = successPayment?.cf_payment_id || null;
                    }
                    const ordersToUpdate = await Order.find({ cashfreeOrderId: cfId });
                    for (const order of ordersToUpdate) {
                      if (order.status !== 'placed') {
                        order.status = 'placed';
                        order.paymentId = cfPaymentId || cfId;
                        await order.save();
                        await decrementStockForOrder(order);
                        await syncOrderToShiprocket(order);
                        await Cart.findOneAndUpdate({ userId: order.userId }, { items: [] }).catch(() => {});
                      }
                    }
                  }
                }
              } catch (e) {
                console.error(`Admin self-healing Cashfree order ${cfId} error:`, e);
              }
            }
          }
        }
      } catch (selfHealErr) {
        console.error('Admin self-healing check error:', selfHealErr);
      }
    }

    if (type === 'orders') {
      const orders = await Order.find({ status: { $ne: 'pending' } })
        .populate('userId', 'name email role')
        .populate('vendorId', 'name email')
        .populate('products.productId', 'title price images')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(4000);

      return createSuccessResponse({ orders });
    }

    if (type === 'users') {
      const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(4000);

      return createSuccessResponse({ users });
    }

    const [orders, users] = await Promise.all([
      Order.find({ status: { $ne: 'pending' } })
        .populate('userId', 'name email role')
        .populate('vendorId', 'name email')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(4000),
      User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(4000),
    ]);

    return createSuccessResponse({ orders, users });
  } catch (error: any) {
    const isConn =
      error?.code === 'DB_CONNECTIVITY_UNAVAILABLE' ||
      error?.code === 'DB_CONNECTIVITY_TIMEOUT' ||
      isDatabaseConnectivityError(error);
    return createErrorResponse(error.message || 'Failed to fetch admin data', isConn ? 503 : 500);
  }
}
