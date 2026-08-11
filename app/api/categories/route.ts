import { NextRequest } from 'next/server';
import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { getCategoryImage, PRODUCT_CATEGORIES, normalizeCategoryName } from '@/lib/catalog';

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

    const rawCategories = [
      ...PRODUCT_CATEGORIES,
      ...configuredCategories,
      ...productCategories,
    ];

    const categoryMap = new Map<string, string>();
    for (const cat of rawCategories) {
      if (typeof cat === 'string' && cat.trim().length > 0) {
        const canonical = normalizeCategoryName(cat);
        const key = canonical.toLowerCase();
        if (!categoryMap.has(key)) {
          categoryMap.set(key, canonical);
        }
      }
    }

    const categories = Array.from(categoryMap.values()).sort();

    const categoriesWithImages = categories.map((name) => ({
      name,
      image: config?.categoryImages?.[name] || getCategoryImage(name),
    }));

    return createSuccessResponse({
      categories,
      categoriesWithImages,
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