import React, { cache } from 'react';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import { PRODUCT_CATEGORIES, getCategoryImage, getSubcategoriesForCategory } from '@/lib/catalog';
import { resolveOgImageUrl, buildCollectionPageJsonLd, buildBreadcrumbJsonLd } from '@/lib/utils/seo';
import type { Metadata } from 'next';
import CategoryDetailClient from './CategoryDetailClient';

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

// ISR: Incremental Static Regeneration edge cache for 1 hour
export const revalidate = 3600;

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Pre-render all primary catalog categories at build time (SSG)
export async function generateStaticParams() {
  return PRODUCT_CATEGORIES.map((cat) => ({ slug: toSlug(cat) }));
}

// Deduplicated and fast timeout-protected data loader
const getCategoryData = cache(async (slug: string) => {
  let products: any[] = [];
  const normalizedSlug = slug.toLowerCase();
  const isWaterFilter = normalizedSlug === 'freshwater' || normalizedSlug === 'saltwater';

  // Identify matching catalog category
  const staticCategory = PRODUCT_CATEGORIES.find((cat) => toSlug(cat) === normalizedSlug);
  const targetCategory = staticCategory || (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '));

  try {
    const fetchDb = async () => {
      await connectDB();
      const filter: any = { approvalStatus: 'approved', inStock: true };
      if (isWaterFilter) {
        filter.waterType = normalizedSlug;
      } else {
        filter.$or = [
          { category: targetCategory },
          { category: { $regex: new RegExp(`^${normalizedSlug.replace(/-/g, ' ')}$`, 'i') } },
        ];
      }

      return await Product.find(filter)
        .select('title category subcategory waterType scientific rating reviewsCount price images perPairPrice perPiecePrice inStock')
        .limit(48)
        .lean()
        .maxTimeMS(2000);
    };

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const result = await Promise.race([fetchDb(), timeoutPromise]);
    if (result) {
      products = (result as any[]) || [];
    }
  } catch (error) {
    console.warn('Failed to load category products from database, using static catalog:', error);
  }

  const staticSubcategories = staticCategory ? (getSubcategoriesForCategory(staticCategory) as string[]) : [];
  const dynamicSubcategories = Array.from(new Set(products.map((p) => p.subcategory).filter(Boolean))) as string[];
  const subcategories = Array.from(new Set([...staticSubcategories, ...dynamicSubcategories]));

  const categoryTitle = isWaterFilter
    ? normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1)
    : targetCategory;

  return {
    categoryTitle,
    filteredProducts: JSON.parse(JSON.stringify(products)),
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
