import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import type { Metadata } from 'next';

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

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500 selection:text-white pb-24 md:pb-0 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-16">
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
                {category.subcategories.length > 0 && (
                  <p className="mt-1 text-[10px] text-slate-500 line-clamp-2">
                    {category.subcategories.slice(0, 3).join(' • ')}
                    {category.subcategories.length > 3 ? ' …' : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}