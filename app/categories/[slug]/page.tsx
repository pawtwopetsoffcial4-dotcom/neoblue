"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

// removed hardcoded slug-to-category map: categories are resolved from DB/products at runtime

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function CategoryDetailPage({ params }: CategoryPageProps) {
  const [slug, setSlug] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then((data) => setSlug(data.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load products');
        const data = await response.json();
        setProducts(data.products ?? []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories', { cache: 'no-store' });
        if (!response.ok) return;

        const data = await response.json();
        setAvailableCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        setAvailableCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const normalizedSlug = slug.toLowerCase();
  const isWaterFilter = normalizedSlug === 'freshwater' || normalizedSlug === 'saltwater';
  const customCategory = availableCategories.find((category) => toSlug(category) === normalizedSlug);
  const inferredCategory = products.find((p) => toSlug(p.category) === normalizedSlug)?.category;
  const mappedCategory = customCategory ?? inferredCategory;

  const filteredProducts = useMemo(() => {
    if (!slug) return [];
    if (isWaterFilter) {
      return products.filter((product) => product.waterType.toLowerCase() === normalizedSlug);
    }

    if (mappedCategory || customCategory) {
      return products.filter((product) => product.category === (mappedCategory || customCategory));
    }

    return [];
  }, [slug, isWaterFilter, normalizedSlug, mappedCategory, customCategory, products]);

  const subcategories = useMemo(() => {
    if (!mappedCategory) return [];
    return Array.from(
      new Set(products.filter((p) => p.category === mappedCategory).map((p) => p.subcategory).filter(Boolean))
    );
  }, [mappedCategory, products]);

  const categoryTitle = isWaterFilter
    ? normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1)
    : mappedCategory ?? customCategory ?? 'Category';
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500 selection:text-white pb-24 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-10">
        <Link href="/categories" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 mb-5">
          <ArrowLeft className="h-4 w-4" /> Back to Categories
        </Link>

        <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 md:p-8 mb-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{categoryTitle}</h1>
          <p className="mt-3 text-slate-600 max-w-3xl">Curated live inventory for this category.</p>
          {subcategories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {subcategories.map((subcategory) => (
                <span
                  key={subcategory}
                  className="inline-flex items-center rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {subcategory}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-sm font-semibold text-blue-700">
            {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} available
          </p>
        </div>

        {isLoading && (
          <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-12 text-center">
            <p className="text-lg font-semibold text-slate-900">Loading products...</p>
          </div>
        )}

        {!isLoading && <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <article key={product._id} className="rounded-3xl overflow-hidden border border-blue-100 bg-white shadow-sm hover:border-blue-300 transition-colors">
              <img src={product.images?.[0] ?? '/api/placeholder/400/300'} alt={product.title} className="w-full aspect-4/3 object-cover" />
              <div className="p-5">
                <p className="text-xs uppercase tracking-wider text-blue-600 mb-2">
                  {product.category} • {product.waterType}
                </p>
                <h2 className="text-xl font-bold text-slate-900">{product.title}</h2>
                <p className="text-slate-600 text-sm italic mt-1">{product.scientific ?? 'Aquatic premium stock'}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-black text-slate-900">₹{product.price.toFixed(2)}</span>
                  <Link href={`/products/${product._id}`} className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                    View <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>}
      </main>
    </div>
  );
}
