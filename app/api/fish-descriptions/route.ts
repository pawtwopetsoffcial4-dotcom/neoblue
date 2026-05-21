import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FishDescription from '@/lib/models/FishDescription';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const descriptionDoc = await FishDescription.findOne({ name });
    
    if (!descriptionDoc) {
      return NextResponse.json(
        { success: false, error: 'Description not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, description: descriptionDoc.description });
  } catch (error) {
    console.error('Error fetching fish description:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
