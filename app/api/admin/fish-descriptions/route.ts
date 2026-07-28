import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import FishDescription from '@/lib/models/FishDescription';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

// GET all fish descriptions
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') return createErrorResponse('Forbidden', 403);

    const descriptions = await FishDescription.find({}).sort({ createdAt: -1 });
    return createSuccessResponse({ descriptions });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to fetch descriptions', 500);
  }
}

// POST create a new fish description
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') return createErrorResponse('Forbidden', 403);

    const { name, description } = await request.json();

    if (!name || !description) {
      return createErrorResponse('Name and description are required', 400);
    }

    const existing = await FishDescription.findOne({ name });
    if (existing) {
      return createErrorResponse('A description with this name already exists', 400);
    }

    const newDescription = await FishDescription.create({ name, description });
    return createSuccessResponse({ description: newDescription });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to create description', 500);
  }
}
