import React from 'react';
import { PRODUCT_CATEGORIES, getCategoryImage, getSubcategoriesForCategory } from '@/lib/catalog';
import type { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Aquarium Fish & Plant Categories - Browse Species | NeoBlue',
  description: 'Explore our wide selection of live freshwater fish, saltwater invertebrates, aquarium plants, shrimp, and snails categorized by species and care parameters.',
  keywords: ['aquarium fish categories', 'aquatic species online', 'freshwater fish list', 'buy aquarium fish by type'],
  alternates: {
    canonical: 'https://neoblue.in/categories',
  },
};

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function CategoriesPage() {
  const seenSlugs = new Set<string>();
  const categories = PRODUCT_CATEGORIES
    .map((category) => {
      const cleaned = String(category);
      const slug = toSlug(cleaned);
      if (seenSlugs.has(slug)) return null;
      seenSlugs.add(slug);

      const subcategories = (getSubcategoriesForCategory(cleaned) as string[]) || [];
      const image = getCategoryImage(cleaned);

      return {
        slug,
        name: cleaned,
        description: `Browse premium ${cleaned.toLowerCase()} products.`,
        image,
        subcategories,
      };
    })
    .filter((cat): cat is NonNullable<typeof cat> => cat !== null);

  return <CategoriesClient initialCategories={categories} />;
}