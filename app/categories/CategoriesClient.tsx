"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useMode } from '@/lib/hooks/useMode';


interface CategoryItem {
  slug: string;
  name: string;
  description: string;
  image: string;
  subcategories: string[];
}

export default function CategoriesClient({ categories }: { categories: CategoryItem[] }) {
  const { mode } = useMode();

  // Filter categories: in fishes mode hide plants; in plants mode only show plants.
  const filteredCategories = categories.filter((category) => {
    if (mode === 'fishes') {
      return category.slug !== 'plants';
    } else {
      return category.slug === 'plants';
    }
  });


  return (
    <div className={`min-h-screen bg-white text-slate-900 pb-24 md:pb-0 font-sans transition-colors duration-500 selection:bg-blue-500 selection:text-white`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-16">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div className="max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 transition-colors duration-300 ${
              mode === 'fishes' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  mode === 'fishes' ? 'bg-blue-400' : 'bg-green-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  mode === 'fishes' ? 'bg-blue-500' : 'bg-green-600'
                }`}></span>
              </span>
              Browse
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              {mode === 'fishes' ? 'Categories' : 'Plant Categories'}
            </h1>
          </div>
          <Link 
            href="/products" 
            className={`inline-flex items-center gap-2 text-sm font-bold transition-colors group ${
              mode === 'fishes' ? 'text-blue-600 hover:text-blue-700' : 'text-green-600 hover:text-green-700'
            }`}
          >
            {mode === 'fishes' ? 'View All Products' : 'View All Plants'} 
            <ArrowUpRight className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid - Circular Style */}
        {filteredCategories.length > 0 ? (
          <section className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {filteredCategories.map((category) => {
              const isPlants = category.slug === 'plants';
              return (
                <Link 
                  key={category.slug} 
                  href={`/categories/${category.slug}`} 
                  className="group flex flex-col items-center outline-none"
                >
                  {/* Circular Image Container */}
                  <div className={`w-full aspect-square rounded-full p-1 sm:p-2 overflow-hidden flex items-center justify-center transition-all duration-300 active:scale-95 mb-3 sm:mb-4 shadow-sm group-hover:shadow-md border-2 border-transparent ${
                    isPlants 
                      ? 'bg-[#edf9ee] group-hover:bg-[#e2f5e3] group-hover:border-green-200' 
                      : 'bg-[#eef6f9] group-hover:bg-[#e4f0f4] group-hover:border-blue-100'
                  }`}>
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = isPlants ? '/fishes_cat_cover/Plants.png' : '/fishes_cat_cover/Guppies.jpeg';
                      }}
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  
                  {/* Text Content Below Box */}
                  <div className="text-center px-1">
                    <h2 className={`text-xs sm:text-sm md:text-base font-semibold text-slate-800 leading-tight tracking-tight transition-colors ${
                      isPlants ? 'group-hover:text-green-600' : 'group-hover:text-blue-600'
                    }`}>
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
              );
            })}
          </section>
        ) : (
          <div className={`text-center py-20 border-2 border-dashed rounded-3xl ${
            mode === 'fishes' ? 'border-blue-100 text-blue-500' : 'border-green-100 text-green-600'
          }`}>
            <p className="text-sm font-semibold">No categories found in this mode.</p>
          </div>
        )}
      </main>
    </div>
  );
}
