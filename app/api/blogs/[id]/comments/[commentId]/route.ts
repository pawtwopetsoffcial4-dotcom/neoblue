import { connectDB } from '@/lib/db';
import BlogComment from '@/lib/models/BlogComment';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

// PATCH approve/edit comment (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { id, commentId } = await params;
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can approve comments', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return createErrorResponse('Invalid comment ID', 400);
    }

    const comment = await BlogComment.findById(commentId);
    if (!comment || comment.blogId.toString() !== id) {
      return createErrorResponse('Comment not found', 404);
    }

    const body = await request.json();

    if (body.isApproved !== undefined) {
      comment.isApproved = body.isApproved;
    }

    if (body.content !== undefined) {
      const content = String(body.content).trim();
      if (content.length < 3) {
        return createErrorResponse('Comment must be at least 3 characters', 400);
      }
      if (content.length > 2000) {
        return createErrorResponse('Comment cannot exceed 2000 characters', 400);
      }
      comment.content = content;
    }

    await comment.save();
    return createSuccessResponse({ message: 'Comment updated successfully', comment });
  } catch (error: any) {
    console.error('Update comment error:', error);
    return createErrorResponse(error.message || 'Failed to update comment', 500);
  }
}

// DELETE comment (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { id, commentId } = await params;
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can delete comments', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return createErrorResponse('Invalid comment ID', 400);
    }

    const comment = await BlogComment.findById(commentId);
    if (!comment || comment.blogId.toString() !== id) {
      return createErrorResponse('Comment not found', 404);
    }

    // Delete the comment
    await BlogComment.findByIdAndDelete(commentId);

    // Remove from parent's replies if it's a reply
    if (comment.parentId) {
      await BlogComment.findByIdAndUpdate(comment.parentId, { $pull: { replies: commentId } });
    }

    // Delete all replies if this is a parent comment
    if (comment.replies && comment.replies.length > 0) {
      await BlogComment.deleteMany({ _id: { $in: comment.replies } });
    }

    return createSuccessResponse({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return createErrorResponse(error.message || 'Failed to delete comment', 500);
  }
}
