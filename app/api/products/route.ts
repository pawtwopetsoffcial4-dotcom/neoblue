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
    const vendorId = searchParams.get('vendorId');
    const limit = parseInt(searchParams.get('limit') || '500'); // Increased limit to fetch all typical products
    const page = parseInt(searchParams.get('page') || '1');

    let query: any = {};

    if (category) query.category = category;
    if (waterType) query.waterType = waterType;
    if (vendorId) query.vendorId = vendorId;

    // Check authorization to handle role-based product filtering
    const token = getTokenFromRequest(request);
    let userPayload: any = null;
    if (token) {
      try {
        userPayload = verifyToken(token);
      } catch (err) {
        // Ignore invalid tokens for reading the public products API
      }
    }

    if (userPayload?.role === 'admin') {
      // Admin sees all products
    } else if (userPayload?.role === 'vendor' && vendorId && vendorId === userPayload.userId) {
      // Vendor sees their own products (including pending/rejected)
    } else {
      // General public/customers and other vendors only see approved products
      query.approvalStatus = 'approved';
    }

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

    const { title, description, price, images, videos, category, subcategory, waterType, tag, scientific, size, ageCategory, originalPrice, discountPercentage, perPiecePrice, perPairPrice, weightPerPiece, shippingType, shippingCharge, shippingLotSize, shippingPieceRanges, shippingWeightRanges, shippingNorth1Ranges, shippingNorth2Ranges, shippingNorth3Ranges, shippingNorth4Ranges, shippingSouth1Ranges, shippingSouth2Ranges, shippingSouth3Ranges, shippingSouth4Ranges, deliverNorth, deliverSouth, phMin, phMax, tempMin, tempMax, temperament, stockQuantity, faq, quickOverview, aboutSpecies, behavioralTraits, genderIdentification, sustainabilitySourcing, section5Title, section5Content, careTemp, carePh, careWaterHardness, careWaterCurrent, careTankSetup, careHidingSpots, lightingRequirement, co2Requirement, growthRate, placement, careDifficulty } = await request.json();

    // Validate required fields
    if (!title || !description || price == null || !images || !category || !waterType) {
      return createErrorResponse('Please provide all required fields', 400);
    }

    // Validate optional discount and unit pricing fields
    const safeOriginalPrice = originalPrice == null ? undefined : Number(originalPrice);
    const safeDiscount = discountPercentage == null ? undefined : Number(discountPercentage);
    const safePerPiecePrice = perPiecePrice == null ? undefined : Number(perPiecePrice);
    const safePerPairPrice = perPairPrice == null ? undefined : Number(perPairPrice);
    const safeWeightPerPiece = weightPerPiece == null ? 0 : Number(weightPerPiece);
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
    if (isNaN(safeWeightPerPiece) || safeWeightPerPiece < 0) {
      return createErrorResponse('Invalid weightPerPiece', 400);
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
      videos: Array.isArray(videos) ? videos : [],
      category,
      subcategory: subcategory || '',
      waterType,
      tag: tag || 'Standard',
      scientific,
      originalPrice: safeOriginalPrice,
      discountPercentage: safeDiscount,
      perPiecePrice: hasPerPiece ? safePerPiecePrice : null,
      perPairPrice: hasPerPair ? safePerPairPrice : null,
      weightPerPiece: safeWeightPerPiece,
      shippingType: safeShippingType,
      shippingCharge: safeShippingCharge,
      shippingLotSize: safeShippingLotSize,
      shippingPieceRanges: Array.isArray(shippingPieceRanges) ? shippingPieceRanges : undefined,
      shippingWeightRanges: Array.isArray(shippingWeightRanges) ? shippingWeightRanges : undefined,
      shippingNorth1Ranges: Array.isArray(shippingNorth1Ranges) ? shippingNorth1Ranges : undefined,
      shippingNorth2Ranges: Array.isArray(shippingNorth2Ranges) ? shippingNorth2Ranges : undefined,
      shippingNorth3Ranges: Array.isArray(shippingNorth3Ranges) ? shippingNorth3Ranges : undefined,
      shippingNorth4Ranges: Array.isArray(shippingNorth4Ranges) ? shippingNorth4Ranges : undefined,
      shippingSouth1Ranges: Array.isArray(shippingSouth1Ranges) ? shippingSouth1Ranges : undefined,
      shippingSouth2Ranges: Array.isArray(shippingSouth2Ranges) ? shippingSouth2Ranges : undefined,
      shippingSouth3Ranges: Array.isArray(shippingSouth3Ranges) ? shippingSouth3Ranges : undefined,
      shippingSouth4Ranges: Array.isArray(shippingSouth4Ranges) ? shippingSouth4Ranges : undefined,
      deliverNorth: deliverNorth !== false,
      deliverSouth: deliverSouth !== false,
      phMin: phMin != null ? Number(phMin) : 6.0,
      phMax: phMax != null ? Number(phMax) : 8.0,
      tempMin: tempMin != null ? Number(tempMin) : 20,
      tempMax: tempMax != null ? Number(tempMax) : 30,
      temperament: temperament || 'Peaceful',
      vendorId: payload.userId,
      stockQuantity: stockQuantity != null ? Number(stockQuantity) : 0,
      soldQuantity: 0,
      inStock: stockQuantity != null ? Number(stockQuantity) > 0 : false,
      size: size || '',
      ageCategory: ageCategory || 'adult',
      faq: Array.isArray(faq) ? faq : [],
      quickOverview: quickOverview || '',
      aboutSpecies: aboutSpecies || '',
      behavioralTraits: behavioralTraits || '',
      genderIdentification: genderIdentification || '',
      sustainabilitySourcing: sustainabilitySourcing || '',
      section5Title: section5Title || '',
      section5Content: section5Content || '',
      careTemp: careTemp || '',
      carePh: carePh || '',
      careWaterHardness: careWaterHardness || '',
      careWaterCurrent: careWaterCurrent || '',
      careTankSetup: careTankSetup || '',
      careHidingSpots: careHidingSpots || '',
      lightingRequirement: lightingRequirement || undefined,
      co2Requirement: co2Requirement || undefined,
      growthRate: growthRate || undefined,
      placement: placement || undefined,
      careDifficulty: careDifficulty || undefined,
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
