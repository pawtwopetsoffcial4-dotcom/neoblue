import React from 'react';
import { connectDB } from '@/lib/db';
import Product, { PRODUCT_CARD_FIELDS } from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { PRODUCT_CATEGORIES, getCategoryImage } from '@/lib/catalog';
import { resolveOgImageUrl, buildCollectionPageJsonLd, buildBreadcrumbJsonLd } from '@/lib/utils/seo';
import type { Metadata } from 'next';
import CategoryDetailClient from './CategoryDetailClient';

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export async function generateStaticParams() {
  try {
    await connectDB();
    const categories = await Product.distinct('category', { approvalStatus: 'approved' });
    return categories.map((cat: string) => ({ slug: toSlug(cat) }));
  } catch {
    return [];
  }
}

// Helper to resolve category title and filtered products with targeted lean queries
async function getCategoryData(slug: string) {
  await connectDB();

  const normalizedSlug = slug.toLowerCase();
  const isWaterFilter = normalizedSlug === 'freshwater' || normalizedSlug === 'saltwater';

  // Fetch configurations for custom categories
  const config = await StoreConfig.findOne({}).select('categories excludedCategories').lean() as any;
  const excludedList: string[] = Array.isArray(config?.excludedCategories) ? config.excludedCategories : [];
  const excludedSet = new Set(excludedList.map((c: string) => String(c).toLowerCase()));
  const configuredCategories = Array.isArray(config?.categories) ? config.categories : [];

  const availableCategories = Array.from(
    new Set([
      ...PRODUCT_CATEGORIES,
      ...configuredCategories,
    ].filter((category): category is string => typeof category === 'string' && category.trim().length > 0))
  ).filter((category) => !excludedSet.has(category.toLowerCase()));

  let customCategory = availableCategories.find((category) => toSlug(category) === normalizedSlug);
  let mappedCategory = customCategory;

  // If not in static/config list, find matching category name in DB via distinct
  if (!isWaterFilter && !mappedCategory) {
    const distinctCategories = await Product.distinct('category', { approvalStatus: 'approved', inStock: true });
    mappedCategory = distinctCategories.find((c: string) => toSlug(c) === normalizedSlug);
  }

  let filterQuery: any = {
    approvalStatus: 'approved',
    inStock: true,
  };

  if (isWaterFilter) {
    filterQuery.waterType = new RegExp(`^${normalizedSlug}$`, 'i');
  } else if (mappedCategory) {
    filterQuery.category = mappedCategory;
  } else {
    filterQuery.category = '__none__'; // No match
  }

  // Fetch only necessary product card fields with lean query and index
  const products = await Product.find(filterQuery)
    .select(PRODUCT_CARD_FIELDS)
    .sort({ createdAt: -1 })
    .lean() as any[];

  // Fetch subcategories efficiently
  let subcategories: string[] = [];
  if (mappedCategory) {
    subcategories = await Product.distinct('subcategory', {
      category: mappedCategory,
      approvalStatus: 'approved',
      inStock: true,
      subcategory: { $nin: [null, ''] },
    }) as string[];
  }

  const categoryTitle = isWaterFilter
    ? normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1)
    : mappedCategory ?? 'Category';

  return {
    categoryTitle,
    filteredProducts: JSON.parse(JSON.stringify(products)),
    subcategories,
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { categoryTitle, filteredProducts } = await getCategoryData(slug);
    const titleText = `Buy ${categoryTitle} Online — Live Arrival Guaranteed`;
    const descText = `Shop premium ${categoryTitle.toLowerCase()} specimens. Explore ${filteredProducts.length} high-quality options available with secure shipping and live-arrival guarantee from NeoBlue.`;
    const categoryImageUrl = getCategoryImage(categoryTitle);
    const ogImageUrl = resolveOgImageUrl(categoryImageUrl);
    return {
      title: titleText,
      description: descText,
      keywords: [categoryTitle, `buy ${categoryTitle.toLowerCase()} online`, `${categoryTitle.toLowerCase()} price`, 'live fish shop'],
      alternates: {
        canonical: `https://neoblue.in/categories/${slug}`,
      },
      openGraph: {
        title: titleText,
        description: descText,
        url: `https://neoblue.in/categories/${slug}`,
        type: 'website',
        images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630, alt: categoryTitle }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: titleText,
        description: descText,
        images: ogImageUrl ? [ogImageUrl] : [],
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

  const categoryUrl = `https://neoblue.in/categories/${slug}`;
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: categoryTitle,
    description: `Shop premium ${categoryTitle.toLowerCase()} specimens from NeoBlue`,
    url: categoryUrl,
    products: filteredProducts,
  });
  
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: 'https://neoblue.in' },
    { name: 'Categories', url: 'https://neoblue.in/categories' },
    { name: categoryTitle, url: categoryUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryDetailClient
        slug={slug}
        categoryTitle={categoryTitle}
        filteredProducts={filteredProducts}
        subcategories={subcategories}
      />
    </>
  );
}
