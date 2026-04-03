"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';
import MobileDock from '../components/MobileDock';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export default function ProductsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [category, setCategory] = useState('All');
  const [waterType, setWaterType] = useState('All');
  const [tag, setTag] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await fetch('/api/products', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Failed to load products');
        }

        const data = await response.json();
        setProducts(data.products ?? []);
      } catch (error) {
        setLoadError('Unable to load products right now. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.category)))],
    []
  );
  const waterTypes = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.waterType)))],
    []
  );
  const tags = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.tag)))],
    []
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        (product.scientific ?? '').toLowerCase().includes(normalizedQuery) ||
        product.tag.toLowerCase().includes(normalizedQuery);

      const matchesCategory = category === 'All' || product.category === category;
      const matchesWaterType = waterType === 'All' || product.waterType === waterType;
      const matchesTag = tag === 'All' || product.tag === tag;
      const matchesStock = !inStockOnly || product.inStock;

      return matchesSearch && matchesCategory && matchesWaterType && matchesTag && matchesStock;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'rating-desc':
          return b.rating - a.rating;
        default:
          return Number(b.rating) - Number(a.rating);
      }
    });

    return filtered;
  }, [searchTerm, category, waterType, tag, inStockOnly, sortBy]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500 selection:text-white">
      <main className="pt-20 md:pt-28 pb-28 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-blue-600 text-xs font-bold tracking-[0.25em] uppercase mb-3">Catalog</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">All Products</h1>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-slate-500 hover:text-blue-700 transition-colors">
            Back Home <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <section className="rounded-3xl border border-blue-100 bg-blue-50/60 backdrop-blur-xl p-5 md:p-7 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <label className="lg:col-span-2 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, scientific name, or tag"
                className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400"
              />
            </label>

            <label className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent outline-none"
              >
                <option value="featured" className="bg-white">Featured</option>
                <option value="price-asc" className="bg-white">Price: Low to High</option>
                <option value="price-desc" className="bg-white">Price: High to Low</option>
                <option value="name-asc" className="bg-white">Name: A to Z</option>
                <option value="rating-desc" className="bg-white">Top Rated</option>
              </select>
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none"
            >
              {categories.map((value) => (
                <option key={value} value={value} className="bg-white">{value}</option>
              ))}
            </select>

            <select
              value={waterType}
              onChange={(e) => setWaterType(e.target.value)}
              className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none"
            >
              {waterTypes.map((value) => (
                <option key={value} value={value} className="bg-white">{value}</option>
              ))}
            </select>

            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none"
            >
              {tags.map((value) => (
                <option key={value} value={value} className="bg-white">{value}</option>
              ))}
            </select>
          </div>

          <label className="mt-4 inline-flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 accent-blue-500"
            />
            In-stock only
          </label>
        </section>

        <div className="mb-6 text-sm text-slate-500">
          Showing {filteredProducts.length} of {products.length} products
        </div>

        {isLoading && (
          <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-12 text-center">
            <p className="text-lg font-semibold text-slate-900">Loading products...</p>
          </div>
        )}

        {loadError && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-12 text-center">
            <p className="text-lg font-semibold text-rose-700">{loadError}</p>
          </div>
        )}

        {!isLoading && !loadError && filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-12 text-center">
            <p className="text-2xl font-bold text-slate-900 mb-2">No products found</p>
            <p className="text-slate-600">Try broadening your search or clearing one of the filters.</p>
          </div>
        ) : (
          !isLoading && !loadError && <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <article
                key={product._id}
                className="group rounded-3xl overflow-hidden border border-blue-100 bg-white hover:border-blue-400 transition-colors shadow-sm"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={product.images?.[0] ?? '/api/placeholder/400/300'}
                    alt={product.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-75 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/35 to-transparent" />
                  <span className="absolute top-4 left-4 rounded-full bg-white/90 border border-blue-200 px-3 py-1 text-xs font-bold tracking-wide text-blue-700">
                    {product.tag}
                  </span>
                  {!product.inStock && (
                    <span className="absolute top-4 right-4 rounded-full bg-rose-500/20 border border-rose-400/25 px-3 py-1 text-xs font-bold tracking-wide text-rose-200">
                      Out of stock
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs text-blue-700 uppercase tracking-wider mb-2">
                    {product.category} • {product.waterType}
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">{product.title}</h2>
                  <p className="text-slate-600 italic text-sm mt-1">{product.scientific ?? 'Aquatic premium stock'}</p>

                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-900">{formatPrice(product.price)}</p>
                      <p className="text-xs text-blue-600">Rating {product.rating.toFixed(1)} / 5</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        className="h-11 px-5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                      <Link href={`/products/${product._id}`} className="h-11 px-5 rounded-full border border-blue-200 text-blue-700 font-bold hover:bg-blue-50 transition-colors inline-flex items-center">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <MobileDock />
    </div>
  );
}
