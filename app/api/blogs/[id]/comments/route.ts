import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
import BlogComment from '@/lib/models/BlogComment';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

// GET comments for a blog (approved only for public)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));
    const skip = (page - 1) * limit;

    const token = getTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;
    const isAdmin = payload?.role === 'admin';

    const blog = await Blog.findById(id);
    if (!blog) {
      return createErrorResponse('Blog not found', 404);
    }

    const query: Record<string, any> = { blogId: id };
    if (!isAdmin) {
      query.isApproved = true;
    }

    const comments = await BlogComment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('replies', '', { isApproved: true });

    const total = await BlogComment.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return createSuccessResponse({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages,
      },
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return createErrorResponse(error.message || 'Failed to fetch comments', 500);
  }
}

// POST create comment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const blog = await Blog.findById(id);
    if (!blog) {
      return createErrorResponse('Blog not found', 404);
    }

    const body = await request.json();
    const author = String(body.author || '').trim();
    const email = String(body.email || '').trim();
    const content = String(body.content || '').trim();
    const rating = Number(body.rating || 5);
    const parentId = body.parentId || null;

    // Validation
    if (!author || author.length < 2) {
      return createErrorResponse('Please provide a valid name (at least 2 characters)', 400);
    }

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return createErrorResponse('Please provide a valid email address', 400);
    }

    if (!content || content.length < 3) {
      return createErrorResponse('Comment must be at least 3 characters', 400);
    }

    if (content.length > 2000) {
      return createErrorResponse('Comment cannot exceed 2000 characters', 400);
    }

    if (rating < 1 || rating > 5) {
      return createErrorResponse('Rating must be between 1 and 5', 400);
    }

    // If it's a reply, verify parent comment exists
    if (parentId) {
      const parent = await BlogComment.findById(parentId);
      if (!parent || parent.blogId.toString() !== id) {
        return createErrorResponse('Parent comment not found', 404);
      }
    }

    const comment = await BlogComment.create({
      blogId: id,
      author,
      email,
      content,
      rating,
      parentId: parentId || null,
      isApproved: false, // Comments require moderation by default
    });

    // Increment blog comments count
    blog.commentsCount = (blog.commentsCount || 0) + 1;
    await blog.save();

    // If it's a reply, add to parent's replies
    if (parentId) {
      await BlogComment.findByIdAndUpdate(parentId, { $push: { replies: comment._id } });
    }

    return createSuccessResponse(
      {
        message: 'Comment submitted successfully. It will be visible after admin approval.',
        comment,
      },
      201
    );
  } catch (error: any) {
    console.error('Create comment error:', error);
    return createErrorResponse(error.message || 'Failed to create comment', 500);
  }
}
