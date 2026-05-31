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
      shippingPieceRanges: user.shippingPieceRanges || [],
      shippingWeightRanges: user.shippingWeightRanges || []
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

    const { shippingPieceRanges, shippingWeightRanges } = await request.json();

    if (!Array.isArray(shippingPieceRanges) || !Array.isArray(shippingWeightRanges)) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.shippingPieceRanges = shippingPieceRanges;
    user.shippingWeightRanges = shippingWeightRanges;
    await user.save();

    return NextResponse.json({ success: true, shippingPieceRanges: user.shippingPieceRanges, shippingWeightRanges: user.shippingWeightRanges });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
