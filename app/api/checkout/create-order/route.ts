import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { calculateProductShippingAmount, calculateRegionalShipping } from '@/lib/utils/shipping';

const appId = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;
const cashfreeEnv = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';

const getCashfreeBaseUrl = () => (cashfreeEnv === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com');

const getAppUrl = (request: NextRequest) => {
  const configuredReturnUrl = process.env.CASHFREE_RETURN_URL;
  if (configuredReturnUrl && !configuredReturnUrl.includes('your-domain.example')) {
    return configuredReturnUrl.replace(/\/$/, '');
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return request.nextUrl.origin;
};

export async function POST(request: NextRequest) {
  try {
    if (!appId || !secretKey) {
      return createErrorResponse('Cashfree keys are not configured', 500);
    }

    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'user') {
      return createErrorResponse('Only users can create checkout orders', 403);
    }

    const { products, address } = await request.json();
    if (!products || !Array.isArray(products) || products.length === 0) {
      return createErrorResponse('Please provide products', 400);
    }

    const stateName = address?.state || '';

    const productIds = products.map((product: any) => product.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== productIds.length) {
      return createErrorResponse('Some products not found', 404);
    }

    let subtotal = 0;
    let plantsGstAmount = 0;
    const orderProducts = products.map((item: any) => {
      const product = dbProducts.find((entry) => entry._id.toString() === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      const itemSubtotal = Number(product.price) * Number(item.quantity || 0);
      subtotal += itemSubtotal;

      if (product.category === 'Plants') {
        plantsGstAmount += itemSubtotal * 0.18;
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        vendorId: product.vendorId.toString(),
      };
    });

    const shippingAmount = dbProducts.reduce((sum, product) => {
      const orderItem = products.find((item: any) => item.productId === product._id.toString());
      return sum + calculateRegionalShipping(
        product,
        stateName,
        Number(orderItem?.quantity || 0),
        orderItem?.shippingOptionId
      );
    }, 0);
    const amount = subtotal + shippingAmount + plantsGstAmount;

    if (!amount || Number(amount) <= 0) {
      return createErrorResponse('Invalid amount', 400);
    }

    const appUrl = getAppUrl(request);
    if (cashfreeEnv === 'production' && !appUrl.startsWith('https://')) {
      return createErrorResponse('Set CASHFREE_RETURN_URL to your deployed https checkout URL for Cashfree production payments', 400);
    }

    let customerPhone = String(address?.phone || '').trim();
    if (!customerPhone) {
      const user = await User.findById(payload.userId);
      customerPhone = String(user?.phone || '').trim();
    }

    if (!customerPhone || customerPhone === '9999999999' || !/^\+?[0-9]{10,15}$/.test(customerPhone)) {
      return createErrorResponse('A valid contact phone number (10-15 digits) is required to place an order. Please check your delivery details.', 400);
    }

    const orderId = `neo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const cashfreeResponse = await fetch(`${getCashfreeBaseUrl()}/pg/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount.toFixed(2)),
        order_currency: 'INR',
        customer_details: {
          customer_id: payload.userId,
          customer_email: payload.email,
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: appUrl.includes('{order_id}')
            ? appUrl
            : `${appUrl}/checkout?cashfree_order_id={order_id}`,
        },
      }),
    });

    const responseText = await cashfreeResponse.text();
    let order: any = {};
    try {
      order = responseText ? JSON.parse(responseText) : {};
    } catch {
      order = { message: responseText };
    }

    if (!cashfreeResponse.ok) {
      return createErrorResponse(order?.message || order?.error || responseText || 'Failed to create Cashfree order', cashfreeResponse.status);
    }

    // Group products by vendor
    const vendorGroups: Record<
      string,
      {
        products: Array<{ productId: string; quantity: number; price: number }>;
        subtotal: number;
        shippingAmount: number;
      }
    > = {};

    for (const op of orderProducts) {
      const vId = op.vendorId;
      if (!vendorGroups[vId]) {
        vendorGroups[vId] = {
          products: [],
          subtotal: 0,
          shippingAmount: 0,
        };
      }
      vendorGroups[vId].products.push({
        productId: op.productId,
        quantity: op.quantity,
        price: op.price,
      });
      vendorGroups[vId].subtotal += op.price * op.quantity;
    }

    // Calculate shipping amount per vendor group
    for (const vId of Object.keys(vendorGroups)) {
      const vendorDbProducts = dbProducts.filter((dp) => dp.vendorId.toString() === vId);
      const groupShipping = vendorDbProducts.reduce((sum, product) => {
        const orderItem = products.find((item: any) => item.productId === product._id.toString());
        return sum + calculateRegionalShipping(
          product,
          stateName,
          Number(orderItem?.quantity || 0),
          orderItem?.shippingOptionId
        );
      }, 0);
      vendorGroups[vId].shippingAmount = groupShipping;
    }

    // Create pending orders in MongoDB
    for (const [vId, group] of Object.entries(vendorGroups)) {
      const groupGst = group.products.reduce((sum, gp) => {
        const product = dbProducts.find((entry) => entry._id.toString() === gp.productId);
        if (product && product.category === 'Plants') {
          return sum + (gp.price * gp.quantity * 0.18);
        }
        return sum;
      }, 0);

      await Order.create({
        userId: payload.userId,
        vendorId: vId,
        products: group.products,
        totalAmount: group.subtotal + group.shippingAmount + groupGst,
        shippingAmount: group.shippingAmount,
        address,
        cashfreeOrderId: orderId,
        status: 'pending',
      });
    }

    return NextResponse.json({
      orderId: order.order_id,
      amount,
      currency: 'INR',
      paymentSessionId: order.payment_session_id,
      paymentLink: order.payment_link,
      environment: cashfreeEnv,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to create Cashfree order', 500);
  }
}
