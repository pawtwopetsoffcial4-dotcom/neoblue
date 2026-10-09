import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import mongoose from 'mongoose';

// GET notifications for the authenticated user
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return createErrorResponse('Invalid token', 401);
    }

    const notifications = await Notification.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to top 50 notifications

    return createSuccessResponse({ notifications });
  } catch (error: any) {
    console.warn('Fetch notifications error (returning empty array):', error?.message);
    return createSuccessResponse({ notifications: [] });
  }
}

// PUT mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return createErrorResponse('Invalid token', 401);
    }

    const { id, all } = await request.json().catch(() => ({ id: null, all: false }));

    if (all) {
      // Mark all as read
      await Notification.updateMany({ userId: payload.userId, read: false }, { read: true });
      return createSuccessResponse({ message: 'All notifications marked as read' });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid notification ID', 400);
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    return createSuccessResponse({ message: 'Notification marked as read', notification });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return createErrorResponse(error.message || 'Failed to update notification', 500);
  }
}

// DELETE delete all notifications for the user
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return createErrorResponse('Invalid token', 401);
    }

    await Notification.deleteMany({ userId: payload.userId });

    return createSuccessResponse({ message: 'All notifications cleared successfully' });
  } catch (error: any) {
    console.error('Delete notifications error:', error);
    return createErrorResponse(error.message || 'Failed to delete notifications', 500);
  }
}
