import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { PRODUCT_CATEGORIES, getCategoryImage } from '@/lib/catalog';
import type { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';

export const dynamic = 'force-dynamic';

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
  await connectDB();

  const config = await StoreConfig.findOne({}).lean() as any;
  const excludedList: string[] = Array.isArray(config?.excludedCategories) ? config.excludedCategories : [];
  const excludedSet = new Set(excludedList.map((c: string) => String(c).toLowerCase()));

  const configuredCategories = Array.isArray(config?.categories) ? config.categories : [];

  const productCategories = await Product.distinct('category', {
    approvalStatus: 'approved',
    inStock: true,
  });

  const categoryNames = Array.from(
    new Set([
      ...PRODUCT_CATEGORIES,
      ...configuredCategories,
      ...productCategories,
    ].filter((category): category is string => typeof category === 'string' && category.trim().length > 0))
  ).filter((category) => !excludedSet.has(category.toLowerCase())).sort();

  const products = await Product.find({
    approvalStatus: 'approved',
    inStock: true,
  }).select('category subcategory images').lean() as any[];

  const seenSlugs = new Set<string>();
  const categories = categoryNames
    .map((category) => {
      const cleaned = String(category);
      const slug = toSlug(cleaned);
      if (seenSlugs.has(slug)) return null;
      seenSlugs.add(slug);
      const categoryProducts = products.filter((p) => p.category === cleaned);
      const subcategories = Array.from(new Set(categoryProducts.map((p) => p.subcategory).filter(Boolean))) as string[];
      const image = config?.categoryImages?.[cleaned] || getCategoryImage(cleaned) || categoryProducts.find((p) => Array.isArray(p.images) && p.images.length > 0)?.images?.[0] || 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800';

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