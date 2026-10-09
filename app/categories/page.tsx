import React from 'react';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { PRODUCT_CATEGORIES, getCategoryImage, getSubcategoriesForCategory } from '@/lib/catalog';
import type { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';

// Enable Incremental Static Regeneration so Cloudflare edge caches the rendered page
// and delivers sub-50ms responses without re-hitting MongoDB on every single request.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Aquarium Fish & Plant Categories - Browse Species | NeoBlue',
  description: 'Explore our wide selection of live freshwater fish, saltwater invertebrates, aquarium plants, shrimp, and snails categorized by species and care parameters.',
  keywords: ['aquarium fish categories', 'aquatic species online', 'freshwater fish list', 'buy aquarium fish by type'],
  alternates: {
    canonical: 'https://neoblue.in/categories',
  },
};

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default async function CategoriesPage() {
  let config: any = null;
  let productCategories: string[] = [];
  let products: any[] = [];

  try {
    const fetchDb = async () => {
      await connectDB();
      const [dbConfig, dbProductCategories, dbProducts] = await Promise.all([
        StoreConfig.findOne({}).lean(),
        Product.distinct('category', {
          approvalStatus: 'approved',
          inStock: true,
        }),
        Product.find({
          approvalStatus: 'approved',
          inStock: true,
        })
          .select('category subcategory images')
          .lean(),
      ]);
      return { config: dbConfig, productCategories: dbProductCategories, products: dbProducts };
    };

    // Strict 2000ms timeout prevents Cloudflare Worker from hanging or throwing 1101 on cold starts
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const result = await Promise.race([fetchDb(), timeoutPromise]);

    if (result) {
      config = result.config;
      productCategories = (result.productCategories as string[]) || [];
      products = (result.products as any[]) || [];
    }
  } catch (error) {
    console.warn('CategoriesPage fallback to catalog:', error);
  }

  const excludedList: string[] = Array.isArray(config?.excludedCategories) ? config.excludedCategories : [];
  const excludedSet = new Set(excludedList.map((c: string) => String(c).toLowerCase()));
  const configuredCategories = Array.isArray(config?.categories) ? config.categories : [];

  const categoryNames = Array.from(
    new Set([
      ...PRODUCT_CATEGORIES,
      ...configuredCategories,
      ...productCategories,
    ].filter((category): category is string => typeof category === 'string' && category.trim().length > 0))
  ).filter((category) => !excludedSet.has(category.toLowerCase())).sort();

  const seenSlugs = new Set<string>();
  const categories = categoryNames
    .map((category) => {
      const cleaned = String(category);
      const slug = toSlug(cleaned);
      if (seenSlugs.has(slug)) return null;
      seenSlugs.add(slug);

      const categoryProducts = products.filter((p) => p.category === cleaned);
      const staticSubcategories = (getSubcategoriesForCategory(cleaned) as string[]) || [];
      const dynamicSubcategories = categoryProducts.map((p) => p.subcategory).filter(Boolean);
      const subcategories = Array.from(new Set([...staticSubcategories, ...dynamicSubcategories]));

      const image =
        config?.categoryImages?.[cleaned] ||
        getCategoryImage(cleaned) ||
        categoryProducts.find((p) => Array.isArray(p.images) && p.images.length > 0)?.images?.[0] ||
        '/fishes_cat_cover/Guppies.jpeg';

      return {
        slug,
        name: cleaned,
        description: `Browse premium ${cleaned.toLowerCase()} products.`,
        image,
        subcategories,
      };
    })
    .filter((cat): cat is NonNullable<typeof cat> => cat !== null);

  return <CategoriesClient categories={categories} />;
}