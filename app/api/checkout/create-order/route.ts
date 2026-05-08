import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createErrorResponse } from '@/lib/utils/auth';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { calculateShippingAmount } from '@/lib/utils/shipping';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!keyId || !keySecret) {
      return createErrorResponse('Razorpay keys are not configured', 500);
    }

    await connectDB();

    const { products } = await request.json();
    if (!products || !Array.isArray(products) || products.length === 0) {
      return createErrorResponse('Please provide products', 400);
    }

    const productIds = products.map((product: any) => product.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== productIds.length) {
      return createErrorResponse('Some products not found', 404);
    }

    const storeConfig = await StoreConfig.findOne({});
    if (!storeConfig) {
      return createErrorResponse('Shipping configuration is not available', 500);
    }

    let subtotal = 0;
    const cartQuantity = products.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);

    for (const item of products) {
      const product = dbProducts.find((entry) => entry._id.toString() === item.productId);
      if (!product) {
        return createErrorResponse('Some products not found', 404);
      }
      subtotal += Number(product.price) * Number(item.quantity || 0);
    }

    const shippingAmount = calculateShippingAmount(cartQuantity, storeConfig.shippingPerPiece, storeConfig.shippingPerWeight);
    const amount = subtotal + shippingAmount;

    if (!amount || Number(amount) <= 0) {
      return createErrorResponse('Invalid amount', 400);
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: `neo_${Date.now()}`,
      payment_capture: true,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to create Razorpay order', 500);
  }
}
