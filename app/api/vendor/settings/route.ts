import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/utils/auth';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;
  
  return payload.userId;
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user: any = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      shippingRatesSouth: user.shippingRatesSouth || { slab500g: 0, slab1kg: 0, slab2kg: 0, slab3kg: 0, slab5kg: 0, slab10kg: 0 },
      shippingRatesNorth: user.shippingRatesNorth || { slab500g: 0, slab1kg: 0, slab2kg: 0, slab3kg: 0, slab5kg: 0, slab10kg: 0 },
      nonServiceableStates: user.nonServiceableStates || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shippingRatesSouth, shippingRatesNorth, nonServiceableStates } = await request.json();

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (shippingRatesSouth) user.shippingRatesSouth = shippingRatesSouth;
    if (shippingRatesNorth) user.shippingRatesNorth = shippingRatesNorth;
    if (nonServiceableStates) user.nonServiceableStates = nonServiceableStates;
    
    await user.save();

    return NextResponse.json({ 
      success: true, 
      shippingRatesSouth: user.shippingRatesSouth, 
      shippingRatesNorth: user.shippingRatesNorth,
      nonServiceableStates: user.nonServiceableStates 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
