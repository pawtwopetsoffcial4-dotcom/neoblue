import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import type { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Aquatic Categories & Species | NeoBlue',
  description: 'Explore our curated selection of live tropical fish, cichlids, guppies, crayfish, and premium aquatic life.',
};

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default async function CategoriesPage() {
  await connectDB();

  const config = await StoreConfig.findOne({}).lean() as any;
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
  ).sort();

  const products = await Product.find({
    approvalStatus: 'approved',
    inStock: true,
  }).select('category subcategory images').lean() as any[];

  const categories = categoryNames.map((category) => {
    const cleaned = String(category);
    const categoryProducts = products.filter((p) => p.category === cleaned);
    const subcategories = Array.from(new Set(categoryProducts.map((p) => p.subcategory).filter(Boolean))) as string[];
    const image = categoryProducts.find((p) => Array.isArray(p.images) && p.images.length > 0)?.images?.[0] ?? 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800';

    return {
      slug: toSlug(cleaned),
      name: cleaned,
      description: `Browse premium ${cleaned.toLowerCase()} products.`,
      image,
      subcategories,
    };
  });

  return <CategoriesClient categories={categories} />;
}