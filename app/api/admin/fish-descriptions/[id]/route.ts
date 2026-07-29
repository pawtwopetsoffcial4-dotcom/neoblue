import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import FishDescription from '@/lib/models/FishDescription';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') return createErrorResponse('Forbidden', 403);

    const { name, description } = await request.json();
    const { id } = await context.params;

    if (!name || !description) {
      return createErrorResponse('Name and description are required', 400);
    }

    const existing = await FishDescription.findOne({ name, _id: { $ne: id } });
    if (existing) {
      return createErrorResponse('Another description with this name already exists', 400);
    }

    const updated = await FishDescription.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!updated) {
      return createErrorResponse('Description not found', 404);
    }

    return createSuccessResponse({ description: updated });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to update description', 500);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') return createErrorResponse('Forbidden', 403);

    const { id } = await context.params;

    const deleted = await FishDescription.findByIdAndDelete(id);

    if (!deleted) {
      return createErrorResponse('Description not found', 404);
    }

    return createSuccessResponse({ success: true });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to delete description', 500);
  }
}
