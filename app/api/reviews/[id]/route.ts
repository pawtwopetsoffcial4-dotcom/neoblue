import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Review from '@/lib/models/Review';
import { getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    const reviews = await Review.find({ productId: id }).sort({ createdAt: -1 });
    return NextResponse.json({ reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;

    // Verify token
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Please login to write a review.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session. Please login again.' }, { status: 401 });
    }

    const body = await request.json();
    const { user, rating, comment } = body || {};

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid payload. Rating must be 1-5.' }, { status: 400 });
    }

    const nameToSave = user || payload.email.split('@')[0];

    const newReview = await Review.create({
      productId: id,
      user: nameToSave,
      rating: Math.round(rating),
      comment: comment || '',
      verified: true,
      avatar: nameToSave.charAt(0).toUpperCase(),
      date: new Date(),
    });

    // Recalculate average rating for product
    const allReviews = await Review.find({ productId: id });
    const ratingSum = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    const averageRating = allReviews.length > 0 ? (ratingSum / allReviews.length) : 5;

    await Product.findByIdAndUpdate(id, {
      rating: Math.round(averageRating * 10) / 10,
      reviewsCount: allReviews.length,
    });

    return NextResponse.json({ ok: true, review: newReview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
