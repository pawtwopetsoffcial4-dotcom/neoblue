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
  Guppies: {
    name: 'Guppies',
    description: 'Colorful guppy strains selected for active behavior and hardy adaptation.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
  Betta: {
    name: 'Betta',
    description: 'Premium bettas with vivid fins and strong health standards.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
  "Angel's": {
    name: "Angel's",
    description: 'Elegant angelfish varieties curated for home and display aquariums.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
  Discuss: {
    name: 'Discuss',
    description: 'High-grade discus fish selected for pattern, color, and vitality.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
  Platy: {
    name: 'Platy',
    description: 'Community-friendly platies available in bright and rare color mixes.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
  'Exotic Molly': {
    name: 'Exotic Molly',
    description: 'Exotic molly lines known for vibrant patterns and stable breeding stock.',
    image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
  },
  Zebra: {
    name: 'Zebra',
    description: 'Distinct zebra-pattern fish collections with strong compatibility profiles.',
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

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`} className="group relative flex flex-col items-center justify-center p-3 sm:p-6 border border-blue-100 bg-white shadow-sm hover:border-blue-300 transition-all rounded-full aspect-square text-center overflow-hidden hover:scale-105">
              <div className="absolute inset-0 z-0">
                <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
              </div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-md">{category.name}</h2>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-50 max-w-[90%] sm:max-w-[80%] mx-auto line-clamp-2 drop-shadow-md hidden sm:block">{category.description}</p>
              </div>
            </Link>
          ))}
        </section>
      </main>

      <MobileDock />
    </div>
  );
}
