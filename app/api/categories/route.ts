import { NextRequest } from 'next/server';
import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { getCategoryImage, PRODUCT_CATEGORIES, normalizeCategoryName } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const config = await StoreConfig.findOne({});
    const excludedList: string[] = Array.isArray(config?.excludedCategories) ? config.excludedCategories : [];
    const excludedSet = new Set(excludedList.map((c: string) => normalizeCategoryName(c).toLowerCase()));

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
        if (!excludedSet.has(key) && !categoryMap.has(key)) {
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
    console.warn('Get categories fallback to static catalog:', error?.message);
    const categories = [...PRODUCT_CATEGORIES].sort();
    const categoriesWithImages = categories.map((name) => ({
      name,
      image: getCategoryImage(name),
    }));

    return createSuccessResponse({
      categories,
      categoriesWithImages,
    });
  }
}

// POST add category (admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Forbidden: Admin access required', 403);
    }

    const { name, image } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return createErrorResponse('Category name is required', 400);
    }

    const normalizedName = normalizeCategoryName(name.trim());
    const lowerName = normalizedName.toLowerCase();

    let config = await StoreConfig.findOne({});
    if (!config) {
      config = await StoreConfig.create({});
    }

    const currentCategories: string[] = Array.isArray(config.categories) && config.categories.length > 0
      ? config.categories
      : [...PRODUCT_CATEGORIES];

    const alreadyExists = currentCategories.some((c: string) => normalizeCategoryName(c).toLowerCase() === lowerName);
    const newCategories = alreadyExists ? currentCategories : [...currentCategories, normalizedName];

    const currentExcluded: string[] = Array.isArray(config.excludedCategories) ? config.excludedCategories : [];
    const newExcluded = currentExcluded.filter((c: string) => normalizeCategoryName(c).toLowerCase() !== lowerName);

    const newCategoryImages = { ...(config.categoryImages || {}) };
    if (image && typeof image === 'string') {
      newCategoryImages[normalizedName] = image;
    }

    await StoreConfig.findOneAndUpdate(
      {},
      {
        $set: {
          categories: newCategories,
          excludedCategories: newExcluded,
          categoryImages: newCategoryImages,
        },
      },
      { upsert: true, new: true }
    );

    return createSuccessResponse(
      {
        message: `Category "${normalizedName}" added successfully`,
        categories: newCategories,
        excludedCategories: newExcluded,
        categoryImages: newCategoryImages,
      },
      201
    );
  } catch (error) {
    console.error('Add category error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to add category', 500);
  }
}

// DELETE category (admin only)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Forbidden: Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    let categoryName = searchParams.get('name') || searchParams.get('category');
    if (!categoryName) {
      try {
        const body = await request.json();
        categoryName = body.name || body.category;
      } catch {
        // no body provided
      }
    }

    if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
      return createErrorResponse('Category name is required', 400);
    }

    const normalizedName = normalizeCategoryName(categoryName.trim());
    const lowerName = normalizedName.toLowerCase();

    let config = await StoreConfig.findOne({});
    if (!config) {
      config = await StoreConfig.create({});
    }

    const currentCategories: string[] = Array.isArray(config.categories) && config.categories.length > 0 
      ? config.categories 
      : PRODUCT_CATEGORIES;
    const newCategories = currentCategories.filter((c: string) => normalizeCategoryName(c).toLowerCase() !== lowerName);

    const currentExcluded: string[] = Array.isArray(config.excludedCategories) ? config.excludedCategories : [];
    const newExcluded = Array.from(new Set([...currentExcluded.map((c: string) => normalizeCategoryName(c)), normalizedName]));

    const newCategoryImages = { ...(config.categoryImages || {}) };
    delete newCategoryImages[normalizedName];
    delete newCategoryImages[categoryName];

    const newSubcategories = { ...(config.subcategories || {}) };
    delete newSubcategories[normalizedName];
    delete newSubcategories[categoryName];

    await StoreConfig.findOneAndUpdate(
      {},
      {
        $set: {
          categories: newCategories,
          excludedCategories: newExcluded,
          categoryImages: newCategoryImages,
          subcategories: newSubcategories,
        },
      },
      { upsert: true, new: true }
    );

    return createSuccessResponse({
      message: `Category "${normalizedName}" removed successfully`,
      categories: newCategories,
      excludedCategories: newExcluded,
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return createErrorResponse(error.message || 'Failed to remove category', 500);
  }
}