import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'reviews.json');

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    return {};
  }
}

async function writeData(obj: any) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await readData();
  const forProduct = Array.isArray(data[id]) ? data[id] : [];
  return NextResponse.json({ reviews: forProduct });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user, rating, comment } = body || {};

    if (!user || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const data = await readData();
    const forProduct = Array.isArray(data[id]) ? data[id] : [];
    const newReview = {
      id: Date.now(),
      user,
      rating: Math.round(rating),
      comment: comment || '',
      date: new Date().toISOString(),
      avatar: user.charAt(0).toUpperCase(),
      verified: true,
    };
    forProduct.unshift(newReview);
    data[id] = forProduct;
    await writeData(data);

    return NextResponse.json({ ok: true, review: newReview });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
