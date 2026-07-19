import React from 'react';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import type { Metadata } from 'next';
import CategoryDetailClient from './CategoryDetailClient';

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Helper to resolve category title and filtered products
async function getCategoryData(slug: string) {
  await connectDB();

  const normalizedSlug = slug.toLowerCase();
  const isWaterFilter = normalizedSlug === 'freshwater' || normalizedSlug === 'saltwater';

  // Fetch all approved, in-stock products
  const products = await Product.find({
    approvalStatus: 'approved',
    inStock: true,
  }).lean() as any[];

  // Fetch configurations for custom categories
  const config = await StoreConfig.findOne({}).lean() as any;
  const configuredCategories = Array.isArray(config?.categories) ? config.categories : [];

  const availableCategories = Array.from(
    new Set([
      ...PRODUCT_CATEGORIES,
      ...configuredCategories,
    ].filter((category): category is string => typeof category === 'string' && category.trim().length > 0))
  );

  const customCategory = availableCategories.find((category) => toSlug(category) === normalizedSlug);
  const inferredCategory = products.find((p) => toSlug(p.category) === normalizedSlug)?.category;
  const mappedCategory = customCategory ?? inferredCategory;

  let filteredProducts: any[] = [];
  if (isWaterFilter) {
    filteredProducts = products.filter((product) => product.waterType && product.waterType.toLowerCase() === normalizedSlug);
  } else if (mappedCategory || customCategory) {
    filteredProducts = products.filter((product) => product.category === (mappedCategory || customCategory));
  }

  const subcategories = mappedCategory
    ? Array.from(new Set(products.filter((p) => p.category === mappedCategory).map((p) => p.subcategory).filter(Boolean))) as string[]
    : [];

  const categoryTitle = isWaterFilter
    ? normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1)
    : mappedCategory ?? customCategory ?? 'Category';

  return {
    categoryTitle,
    filteredProducts: JSON.parse(JSON.stringify(filteredProducts)),
    subcategories,
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { categoryTitle, filteredProducts } = await getCategoryData(slug);
    const titleText = `Buy ${categoryTitle} Online - Live Arrival Guaranteed | NeoBlue`;
    const descText = `Shop premium ${categoryTitle.toLowerCase()} specimens. Explore ${filteredProducts.length} high-quality options available with secure shipping and live-arrival guarantee from NeoBlue.`;
    return {
      title: titleText,
      description: descText,
      keywords: [categoryTitle, `buy ${categoryTitle.toLowerCase()} online`, `${categoryTitle.toLowerCase()} price`, 'live fish shop'],
      alternates: {
        canonical: `https://neoblue.in/categories/${slug}`,
      },
    };
  } catch {
    return {
      title: 'Aquatic Category | NeoBlue',
    };
  }
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const { categoryTitle, filteredProducts, subcategories } = await getCategoryData(slug);

  return (
    <CategoryDetailClient
      slug={slug}
      categoryTitle={categoryTitle}
      filteredProducts={filteredProducts}
      subcategories={subcategories}
    />
  );
}
