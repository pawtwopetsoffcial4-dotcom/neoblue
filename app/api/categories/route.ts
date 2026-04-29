import { NextRequest } from 'next/server';
import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const config = await StoreConfig.findOne({});
    const configuredCategories = Array.isArray(config?.categories) ? config.categories : [];

    const productCategories = await Product.distinct('category', {
      approvalStatus: 'approved',
      inStock: true,
    });

    const categories = Array.from(
      new Set([
        ...configuredCategories,
        ...productCategories,
      ].filter((category): category is string => typeof category === 'string' && category.trim().length > 0))
    ).sort();

    return createSuccessResponse({
      categories,
    });
  } catch (error: any) {
    if (isDatabaseConnectivityError(error)) {
      console.warn('Get categories warning:', error?.message || 'Database connection is temporarily unavailable.');

      return createSuccessResponse({ categories: [] });
    }

    console.error('Get categories error:', error);

    return createErrorResponse(error.message || 'Failed to fetch categories', 500);
  }
}