import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

// GET all products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const waterType = searchParams.get('waterType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    let query: any = {};

    if (category) query.category = category;
    if (waterType) query.waterType = waterType;

    const products = await Product.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('vendorId', 'name email')
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    return createSuccessResponse({
      products,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return createErrorResponse(error.message || 'Failed to fetch products', 500);
  }
}

// POST create product (vendor only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'vendor') {
      return createErrorResponse('Only vendors can create products', 403);
    }

    const { title, description, price, images, category, waterType, tag, scientific } = await request.json();

    // Validate required fields
    if (!title || !description || !price || !images || !category || !waterType) {
      return createErrorResponse('Please provide all required fields', 400);
    }

    const product = await Product.create({
      title,
      description,
      price,
      images,
      category,
      waterType,
      tag: tag || 'Standard',
      scientific,
      vendorId: payload.userId,
      inStock: true,
      approvalStatus: 'pending',
    });

    return createSuccessResponse(
      {
        message: 'Product created successfully',
        product,
      },
      201
    );
  } catch (error: any) {
    console.error('Create product error:', error);
    return createErrorResponse(error.message || 'Failed to create product', 500);
  }
}
