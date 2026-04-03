import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createErrorResponse } from '@/lib/utils/auth';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!keyId || !keySecret) {
      return createErrorResponse('Razorpay keys are not configured', 500);
    }

    const { amount } = await request.json();
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
