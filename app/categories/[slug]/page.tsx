import React, { cache } from 'react';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { PRODUCT_CATEGORIES, getCategoryImage, getSubcategoriesForCategory } from '@/lib/catalog';
import { resolveOgImageUrl, buildCollectionPageJsonLd, buildBreadcrumbJsonLd } from '@/lib/utils/seo';
import type { Metadata } from 'next';
import CategoryDetailClient from './CategoryDetailClient';

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export async function generateStaticParams() {
  const staticSlugs = PRODUCT_CATEGORIES.map((cat) => ({ slug: toSlug(cat) }));
  try {
    const fetchSlugs = async () => {
      await connectDB();
      const categories = await Product.distinct('category', { approvalStatus: 'approved' });
      return categories.map((cat: string) => ({ slug: toSlug(cat) }));
    };
    const timeoutPromise = new Promise<{ slug: string }[]>((resolve) => setTimeout(() => resolve([]), 2000));
    const dynamicSlugs = await Promise.race([fetchSlugs(), timeoutPromise]);
    const all = Array.from(new Set([...staticSlugs.map((s) => s.slug), ...dynamicSlugs.map((s) => s.slug)]));
    return all.map((slug) => ({ slug }));
  } catch {
    return staticSlugs;
  }
}

// Deduplicated and fast timeout-protected data loader
const getCategoryData = cache(async (slug: string) => {
  let products: any[] = [];
  let config: any = null;

  try {
    const fetchDb = async () => {
      await connectDB();
      const [dbProducts, dbConfig] = await Promise.all([
        Product.find({
          approvalStatus: 'approved',
          inStock: true,
        })
          .select('title category subcategory waterType scientific rating reviewsCount price images perPairPrice perPiecePrice inStock')
          .lean(),
        StoreConfig.findOne({}).lean(),
      ]);
      return { products: dbProducts, config: dbConfig };
    };

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const result = await Promise.race([fetchDb(), timeoutPromise]);
    if (result) {
      products = (result.products as any[]) || [];
      config = result.config;
    }
  } catch (error) {
    console.warn('Failed to load category products from database, using static catalog:', error);
  }

  const normalizedSlug = slug.toLowerCase();
  const isWaterFilter = normalizedSlug === 'freshwater' || normalizedSlug === 'saltwater';

  // Fetch configurations for custom categories
  const excludedList: string[] = Array.isArray(config?.excludedCategories) ? config.excludedCategories : [];
  const excludedSet = new Set(excludedList.map((c: string) => String(c).toLowerCase()));
  const configuredCategories = Array.isArray(config?.categories) ? config.categories : [];

  const availableCategories = Array.from(
    new Set([
      ...PRODUCT_CATEGORIES,
      ...configuredCategories,
    ].filter((category): category is string => typeof category === 'string' && category.trim().length > 0))
  ).filter((category) => !excludedSet.has(category.toLowerCase()));

  const customCategory = availableCategories.find((category) => toSlug(category) === normalizedSlug);
  const inferredCategory = products.find((p) => toSlug(p.category) === normalizedSlug)?.category;
  const mappedCategory = customCategory ?? inferredCategory;

  let filteredProducts: any[] = [];
  if (isWaterFilter) {
    filteredProducts = products.filter((product) => product.waterType && product.waterType.toLowerCase() === normalizedSlug);
  } else if (mappedCategory || customCategory) {
    filteredProducts = products.filter((product) => product.category === (mappedCategory || customCategory));
  }

  const staticSubcategories = mappedCategory ? (getSubcategoriesForCategory(mappedCategory) as string[]) : [];
  const dynamicSubcategories = mappedCategory
    ? (Array.from(new Set(products.filter((p) => p.category === mappedCategory).map((p) => p.subcategory).filter(Boolean))) as string[])
    : [];
  const subcategories = Array.from(new Set([...staticSubcategories, ...dynamicSubcategories]));

  const categoryTitle = isWaterFilter
    ? normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1)
    : (mappedCategory ?? customCategory ?? (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')));

  return {
    categoryTitle,
    filteredProducts: JSON.parse(JSON.stringify(filteredProducts)),
    subcategories,
  };
});

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
