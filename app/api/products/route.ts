import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { normalizeShippingRate } from '@/lib/utils/shipping';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET all products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const waterType = searchParams.get('waterType');
    const limit = parseInt(searchParams.get('limit') || '500'); // Increased limit to fetch all typical products
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
    const isDbConnectivityIssue = isDatabaseConnectivityError(error);

    if (isDbConnectivityIssue) {
      console.warn('Get products warning:', error?.message || 'Database connection is temporarily unavailable.');

      return createSuccessResponse({
        products: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          limit: 0,
        },
        warning: 'Database connection is temporarily unavailable.',
      });
    }

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

    const { title, description, price, images, category, subcategory, waterType, tag, scientific, originalPrice, discountPercentage, perPiecePrice, perPairPrice, shippingType, shippingCharge, shippingLotSize, shippingPieceRanges, shippingWeightRanges, shippingNorthSmallRanges, shippingNorthBulkRanges, shippingSouthSmallRanges, shippingSouthBulkRanges } = await request.json();

    // Validate required fields
    if (!title || !description || price == null || !images || !category || !waterType) {
      return createErrorResponse('Please provide all required fields', 400);
    }

    // Validate optional discount and unit pricing fields
    const safeOriginalPrice = originalPrice == null ? undefined : Number(originalPrice);
    const safeDiscount = discountPercentage == null ? undefined : Number(discountPercentage);
    const safePerPiecePrice = perPiecePrice == null ? undefined : Number(perPiecePrice);
    const safePerPairPrice = perPairPrice == null ? undefined : Number(perPairPrice);
    const safeShippingType = shippingType === 'weight' ? 'weight' : 'piece';
    const safeShippingCharge = normalizeShippingRate(shippingCharge);
    const safeShippingLotSize = Number.isFinite(Number(shippingLotSize)) && Number(shippingLotSize) > 0 ? Math.floor(Number(shippingLotSize)) : 1;
    if (safeDiscount != null && (isNaN(safeDiscount) || safeDiscount < 0 || safeDiscount > 100)) {
      return createErrorResponse('Invalid discountPercentage (0-100)', 400);
    }
    if (safePerPiecePrice != null && (isNaN(safePerPiecePrice) || safePerPiecePrice < 0)) {
      return createErrorResponse('Invalid perPiecePrice', 400);
    }
    if (safePerPairPrice != null && (isNaN(safePerPairPrice) || safePerPairPrice < 0)) {
      return createErrorResponse('Invalid perPairPrice', 400);
    }
    if (shippingCharge != null && (isNaN(safeShippingCharge) || safeShippingCharge < 0)) {
      return createErrorResponse('Invalid shippingCharge', 400);
    }

    const hasPerPiece = safePerPiecePrice != null;
    const hasPerPair = safePerPairPrice != null;
    if (hasPerPiece === hasPerPair) {
      return createErrorResponse('Provide exactly one unit price: perPiecePrice or perPairPrice', 400);
    }

    const product = await Product.create({
      title,
      description,
      price,
      images,
      category,
      subcategory: subcategory || '',
      waterType,
      tag: tag || 'Standard',
      scientific,
      originalPrice: safeOriginalPrice,
      discountPercentage: safeDiscount,
      perPiecePrice: hasPerPiece ? safePerPiecePrice : null,
      perPairPrice: hasPerPair ? safePerPairPrice : null,
      shippingType: safeShippingType,
      shippingCharge: safeShippingCharge,
      shippingLotSize: safeShippingLotSize,
      shippingPieceRanges: Array.isArray(shippingPieceRanges) ? shippingPieceRanges : undefined,
      shippingWeightRanges: Array.isArray(shippingWeightRanges) ? shippingWeightRanges : undefined,
      shippingNorthSmallRanges: Array.isArray(shippingNorthSmallRanges) ? shippingNorthSmallRanges : undefined,
      shippingNorthBulkRanges: Array.isArray(shippingNorthBulkRanges) ? shippingNorthBulkRanges : undefined,
      shippingSouthSmallRanges: Array.isArray(shippingSouthSmallRanges) ? shippingSouthSmallRanges : undefined,
      shippingSouthBulkRanges: Array.isArray(shippingSouthBulkRanges) ? shippingSouthBulkRanges : undefined,
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
