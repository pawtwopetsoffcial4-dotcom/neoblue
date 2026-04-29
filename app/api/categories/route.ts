import { NextRequest } from 'next/server';
import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import Product from '@/lib/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const categories = await Product.distinct('category', {
      approvalStatus: 'approved',
      inStock: true,
    });

    return createSuccessResponse({
      categories: categories.filter((category): category is string => typeof category === 'string').sort(),
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