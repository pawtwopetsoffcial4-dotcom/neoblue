import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SharedCart from '@/lib/models/SharedCart';

export const dynamic = 'force-dynamic';

function generateShortCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/cart/share — Creates an ultra-short 6-character share code
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    const cleanItems = items.map((i: any) => ({
      productId: String(i.productId || i.p || ''),
      quantity: Number(i.quantity || i.q) || 1,
    })).filter((i: any) => Boolean(i.productId));

    if (cleanItems.length === 0) {
      return NextResponse.json({ error: 'Invalid cart items' }, { status: 400 });
    }

    // Generate unique 6-character code
    let code = generateShortCode();
    let existing = await SharedCart.findOne({ code });
    let attempts = 0;
    while (existing && attempts < 5) {
      code = generateShortCode();
      existing = await SharedCart.findOne({ code });
      attempts++;
    }

    await SharedCart.create({
      code,
      items: cleanItems,
    });

    return NextResponse.json({
      success: true,
      code,
    });
  } catch (error: any) {
    console.error('Error generating short share code:', error);
    return NextResponse.json({ error: 'Failed to create share code' }, { status: 500 });
  }
}

// GET /api/cart/share?code=A9X2B1 — Fetches cart items for a short code
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    const shared = await SharedCart.findOne({ code: code.toUpperCase().trim() });
    if (!shared) {
      return NextResponse.json({ error: 'Shared cart link expired or not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      items: shared.items,
    });
  } catch (error: any) {
    console.error('Error fetching short share cart:', error);
    return NextResponse.json({ error: 'Failed to fetch shared cart' }, { status: 500 });
  }
}
