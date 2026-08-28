import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import StockAlert from '@/lib/models/StockAlert';
import Product from '@/lib/models/Product';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ error: 'Please provide either an Email address or WhatsApp number' }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findById(productId).select('title').lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existingAlert = await StockAlert.findOne({
      productId,
      ...(email ? { email: email.toLowerCase().trim() } : {}),
      ...(phone ? { phone: phone.trim() } : {}),
      status: 'pending',
    });

    if (existingAlert) {
      return NextResponse.json({
        success: true,
        message: 'You are already registered to receive an alert when this item is restocked!',
      });
    }

    await StockAlert.create({
      email: email ? email.toLowerCase().trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      productId,
      productTitle: (product as any)?.title,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      message: "We'll notify you as soon as this item is back in stock!",
    });
  } catch (error) {
    console.error('Error creating stock alert:', error);
    return NextResponse.json(
      { error: 'Failed to register restock notification. Please try again.' },
      { status: 500 }
    );
  }
}
