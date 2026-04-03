"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import MobileDock from '../components/MobileDock';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

type UICategory = {
  slug: string;
  name: string;
  description: string;
  image: string;
};

const CATEGORY_META: Record<string, Omit<UICategory, 'slug'>> = {
  Fish: {
    name: 'Fish',
    description: 'Fresh and saltwater fish selected for health, color, and compatibility.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
  Coral: {
    name: 'Coral',
    description: 'Hardy and collector coral frags to bring reef tanks to life.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
  Invertebrate: {
    name: 'Invertebrates',
    description: 'Shrimps and cleanup crew species for healthy ecosystems.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
  Plant: {
    name: 'Plants',
    description: 'Aquatic plants for natural aquascapes and oxygen-rich tanks.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
};

const toSlug = (value: string) => value.toLowerCase().replace(/\s+/g, '-');

export default function CategoriesPage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load categories');
        const data = await response.json();
        setProducts(data.products ?? []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories: UICategory[] = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((item) => item.category)));
    return uniqueCategories.map((category) => ({
      slug: toSlug(category),
      ...(CATEGORY_META[category] ?? {
        name: category,
        description: `Browse premium ${category.toLowerCase()} products.`,
        image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
      }),
    }));
  }, [products]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500 selection:text-white pb-24 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-2">Browse</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Categories</h1>
          </div>
          <Link href="/products" className="hidden sm:inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
            View All Products <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading && (
          <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-8 text-center text-slate-700 font-semibold mb-6">
            Loading categories...
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category) => (
            <article key={category.slug} className="rounded-3xl overflow-hidden border border-blue-100 bg-white shadow-sm hover:border-blue-300 transition-colors">
              <img src={category.image} alt={category.name} className="w-full aspect-4/3 object-cover" />
              <div className="p-5">
                <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                <Link href={`/categories/${category.slug}`} className="mt-4 inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                  Explore <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>

      <MobileDock />
    </div>
  );
}
