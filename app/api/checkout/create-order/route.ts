import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import StoreConfig from '@/lib/models/StoreConfig';
import { getProductShippingCharge, getRegionFromState } from '@/lib/utils/shipping';

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

  // Prioritize actual domain host from incoming request (e.g. neoblue.in)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`;
  }

  if (request.nextUrl?.origin) {
    return request.nextUrl.origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'https://neoblue.in';
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

    const productIds = products.map((product: any) => {
      const id = String(product.productId || '');
      return id.includes('_pack_') ? id.split('_pack_')[0] : (id.includes('-pack-') ? id.split('-pack-')[0] : id);
    });
    const uniqueProductIds = Array.from(new Set(productIds));
    const dbProducts = await Product.find({ _id: { $in: uniqueProductIds } }).populate('vendorId');

    if (dbProducts.length !== uniqueProductIds.length) {
      return createErrorResponse('Some products not found', 404);
    }

    let subtotal = 0;
    const orderProducts = products.map((item: any) => {
      const rawId = String(item.productId || '');
      const cleanId = rawId.includes('_pack_') ? rawId.split('_pack_')[0] : (rawId.includes('-pack-') ? rawId.split('-pack-')[0] : rawId);
      const product = dbProducts.find((entry) => entry._id.toString() === cleanId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const packQty = Number(item.packQty) || (item.unitLabel?.startsWith('Pack of ') ? parseInt(item.unitLabel.replace('Pack of ', ''), 10) : 1);
      const unitLabel = item.unitLabel || (packQty > 1 ? `Pack of ${packQty}` : (product.perPairPrice != null ? 'pair' : 'piece'));

      let itemPrice = Number(product.price);
      if (item.price != null && Number(item.price) > 0) {
        itemPrice = Number(item.price);
      } else if (packQty > 1) {
        const discount = packQty === 6 ? 0.10 : packQty === 3 ? 0.05 : 0;
        itemPrice = Math.round(product.price * packQty * (1 - discount));
      }

      const itemSubtotal = itemPrice * Number(item.quantity || 0);
      subtotal += itemSubtotal;

      const vendorIdStr = typeof product.vendorId === 'object' && product.vendorId !== null
        ? ((product.vendorId as any)._id?.toString() || (product.vendorId as any).id?.toString() || String(product.vendorId))
        : String(product.vendorId);

      return {
        productId: product._id.toString(),
        quantity: item.quantity,
        price: itemPrice,
        unitLabel,
        packQty,
        vendorId: vendorIdStr,
      };
    });

    const storeConfig = await StoreConfig.findOne({}).lean();
    const minOrderAmount = Number((storeConfig as any)?.minOrderAmount) || 599;

    if (subtotal < minOrderAmount) {
      return createErrorResponse(
        `Minimum order value is ₹${minOrderAmount} to place an order. Please add ₹${minOrderAmount - subtotal} more worth of items to your bag.`,
        400
      );
    }

    const region = getRegionFromState(stateName);

    // Group products by vendor to calculate shipping per vendor group
    const vendorGroups: Record<
      string,
      {
        products: Array<{ productId: string; quantity: number; price: number }>;
        subtotal: number;
        shippingAmount: number;
        totalWeight: number;
        isServiceable: boolean;
      }
    > = {};

    for (const op of dbProducts) {
      const orderItem = products.find((item: any) => item.productId === op._id.toString());
      const qty = Number(orderItem?.quantity || 0);
      const vId = op.vendorId._id ? op.vendorId._id.toString() : op.vendorId.toString();

      if (!vendorGroups[vId]) {
        vendorGroups[vId] = {
          products: [],
          subtotal: 0,
          shippingAmount: 0,
          totalWeight: 0,
          isServiceable: true,
        };
      }

      vendorGroups[vId].products.push({
        productId: op._id.toString(),
        quantity: qty,
        price: op.price,
      });

      vendorGroups[vId].subtotal += op.price * qty;
      vendorGroups[vId].totalWeight += (op.weightPerPiece || 0) * qty;

      // Check if state is non-serviceable or if region delivery is disabled by vendor
      const vendorUser = op.vendorId; // populated
      const nonServiceable = vendorUser?.nonServiceableStates || [];
      if (stateName && nonServiceable.some((s: string) => s.toLowerCase().trim() === stateName.toLowerCase().trim())) {
        vendorGroups[vId].isServiceable = false;
      }
      if (region === 'North' && vendorUser?.deliverNorth === false) {
        vendorGroups[vId].isServiceable = false;
      }
      if (region === 'South' && vendorUser?.deliverSouth === false) {
        vendorGroups[vId].isServiceable = false;
      }
    }

    // Now compute shipping per vendor group and get total shippingAmount
    let shippingAmount = 0;
    for (const [vId, group] of Object.entries(vendorGroups)) {
      if (!group.isServiceable) {
        return createErrorResponse(`Sorry, this product cannot be delivered to your location.`, 400);
      }

      let groupShipping = 0;
      for (const gp of group.products) {
        const productDoc = dbProducts.find((p) => p._id.toString() === gp.productId);
        groupShipping += getProductShippingCharge(productDoc, gp.quantity, stateName);
      }
      group.shippingAmount = groupShipping;
      shippingAmount += groupShipping;
    }

    const amount = subtotal + shippingAmount;

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

    // Create pending orders in MongoDB
    for (const [vId, group] of Object.entries(vendorGroups)) {
      await Order.create({
        userId: payload.userId,
        vendorId: vId,
        products: group.products,
        totalAmount: group.subtotal + group.shippingAmount,
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
