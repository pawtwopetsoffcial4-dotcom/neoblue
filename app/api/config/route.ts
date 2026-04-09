import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import StoreConfig from '@/lib/models/StoreConfig';

export async function GET() {
  try {
    await connectDB();
    let config = await StoreConfig.findOne({});
    if (!config) {
      config = await StoreConfig.create({});
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ message: 'Error fetching config' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    let config = await StoreConfig.findOne({});
    if (!config) {
      config = await StoreConfig.create(data);
    } else {
      config = await StoreConfig.findOneAndUpdate({}, data, { new: true });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Config PUT error:', error);
    return NextResponse.json({ message: 'Error saving config' }, { status: 500 });
  }
}