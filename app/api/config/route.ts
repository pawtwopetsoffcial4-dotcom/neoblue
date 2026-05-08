import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import StoreConfig from '@/lib/models/StoreConfig';
import { normalizeShippingRate } from '@/lib/utils/shipping';

export async function GET() {
  try {
    await connectDB();
    let config = await StoreConfig.findOne({});
    if (!config) {
      config = await StoreConfig.create({});
    }

    const payload = config.toObject ? config.toObject() : config;

    return NextResponse.json({
      ...payload,
      shippingPerPiece: normalizeShippingRate(payload.shippingPerPiece),
      shippingPerWeight: normalizeShippingRate(payload.shippingPerWeight),
      categories: Array.isArray(payload.categories) && payload.categories.length ? payload.categories : PRODUCT_CATEGORIES,
    });
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ message: 'Error fetching config' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const raw = await request.json();

    const data: any = { ...raw };
    if (Array.isArray(raw?.categories)) {
      data.categories = raw.categories.map((c: any) => String(c).trim()).filter((c: string) => c.length > 0);
    }
    data.shippingPerPiece = normalizeShippingRate(raw?.shippingPerPiece);
    data.shippingPerWeight = normalizeShippingRate(raw?.shippingPerWeight);

    const config = await StoreConfig.findOneAndUpdate({}, { $set: data }, { new: true, upsert: true });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Config PUT error:', error);
    return NextResponse.json({ message: 'Error saving config' }, { status: 500 });
  }
}