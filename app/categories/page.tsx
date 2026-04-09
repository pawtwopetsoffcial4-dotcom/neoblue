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
    image: '/fishes_cat_cover/Guppies.jpeg',
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
  Rams: {
    name: 'Rams',
    description: 'Beautiful Ram Cichlids with vibrant coloration and active personalities.',
    image: '/fishes_cat_cover/Rams.jpeg',
  },
  Shrimps: {
    name: 'Shrimps',
    description: 'Fascinating freshwater shrimp for clean-up crews and planted tanks.',
    image: '/fishes_cat_cover/Shrips.jpeg',
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
    const allCategories = new Set([
      ...Object.keys(CATEGORY_META),
      ...products.map((item) => item.category),
    ]);

    return Array.from(allCategories).map((category) => ({
      slug: toSlug(category),
      ...(CATEGORY_META[category] ?? {
        name: category,
        description: `Browse premium ${category.toLowerCase()} products.`,
        image: 'https://img.freepik.com/free-photo/beautiful-fish-undersea_23-2150737797.jpg?w=800',
      }),
    }));
  }, [products]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500 selection:text-white pb-24 md:pb-0 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-16">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Browse
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Categories
            </h1>
          </div>
          <Link 
            href="/products" 
            className="inline-flex items-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors group"
          >
            View All Products 
            <ArrowUpRight className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-slate-500 animate-pulse">
            Loading categories...
          </div>
        )}

        {/* Categories Grid - Circular Style */}
        <section className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {categories.map((category) => (
            <Link 
              key={category.slug} 
              href={`/categories/${category.slug}`} 
              className="group flex flex-col items-center outline-none"
            >
              {/* Circular Image Container */}
              <div className="w-full aspect-square rounded-full bg-[#eef6f9] p-1 sm:p-2 overflow-hidden flex items-center justify-center transition-transform active:scale-95 group-hover:bg-[#e4f0f4] mb-3 sm:mb-4 shadow-sm group-hover:shadow-md border-2 border-transparent group-hover:border-blue-100">
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              
              {/* Text Content Below Box */}
              <div className="text-center px-1">
                <h2 className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h2>
              </div>
            </Link>
          ))}
        </section>
      </main>

      <MobileDock />
    </div>
  );
}