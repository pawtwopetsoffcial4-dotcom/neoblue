"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Heart, ChevronDown, ShoppingBag, Sparkles, Star, X } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';
import { PRODUCT_CATEGORIES, getSubcategoriesForCategory } from '@/lib/catalog';

const formatPrice = (price: number) => `₹${price}`;

const extractProducts = (payload: unknown): MarketplaceProduct[] => {
  if (Array.isArray(payload)) {
    return payload as MarketplaceProduct[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const data = payload as {
    products?: unknown;
    data?: {
      products?: unknown;
    };
  };

  if (Array.isArray(data.products)) {
    return data.products as MarketplaceProduct[];
  }

  if (Array.isArray(data.data?.products)) {
    return data.data.products as MarketplaceProduct[];
  }

  return [];
};

export default function ProductsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [category, setCategory] = useState('All');
  const [subcategory, setSubcategory] = useState('All');
  const [waterType, setWaterType] = useState('All');
  const [tag, setTag] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await fetch('/api/products', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Failed to load products');
      }

      const data = await response.json();
      setProducts(extractProducts(data));
    } catch {
      setProducts([]);
      setLoadError('Unable to load products right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('featured');
    setCategory('All');
    setSubcategory('All');
    setWaterType('All');
    setTag('All');
    setInStockOnly(false);
  };

  const categoriesList = useMemo(
    () => ['All', ...Array.from(new Set([...PRODUCT_CATEGORIES, ...products.map((product) => product.category)]))],
    [products]
  );

  const subcategoriesList = useMemo(
    () => (category === 'All' ? ['All'] : ['All', ...getSubcategoriesForCategory(category)]),
    [category]
  );

  const waterTypesList = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.waterType)))],
    [products]
  );

  const tagsList = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.tag || 'Standard')))],
    [products]
  );

  const featuredCount = useMemo(
    () => products.filter((product) => (Number(product.rating) || 0) >= 4.5).length,
    [products]
  );

  const inStockCount = useMemo(
    () => products.filter((product) => product.inStock).length,
    [products]
  );

  const activeFilterCount = [
    searchTerm.trim(),
    sortBy !== 'featured',
    category !== 'All',
    subcategory !== 'All',
    waterType !== 'All',
    tag !== 'All',
    inStockOnly,
  ].filter(Boolean).length;

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const titleMatch = product.title?.toLowerCase().includes(normalizedQuery) || false;
      const scientificMatch = product.scientific?.toLowerCase().includes(normalizedQuery) || false;
      const tagMatch = (product.tag || 'Standard').toLowerCase().includes(normalizedQuery) || false;

      const matchesSearch = normalizedQuery.length === 0 || titleMatch || scientificMatch || tagMatch;
      const matchesCategory = category === 'All' || product.category === category;
      const matchesSubcategory = subcategory === 'All' || !subcategory || product.subcategory === subcategory;
      const matchesWaterType = waterType === 'All' || product.waterType === waterType;
      const matchesTag = tag === 'All' || (product.tag || 'Standard') === tag;
      const matchesStock = !inStockOnly || product.inStock;

      return matchesSearch && matchesCategory && matchesSubcategory && matchesWaterType && matchesTag && matchesStock;
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
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        default:
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
    });

    return filtered;
  }, [products, searchTerm, category, subcategory, waterType, tag, inStockOnly, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans selection:bg-blue-100">
      <div className="flex h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-[#F5F7FA] px-4 py-4">
          <section className="relative mb-4 overflow-hidden rounded-3xl border border-blue-100 bg-white px-5 py-6 shadow-sm md:px-7 md:py-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_34%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" /> Live catalog
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl lg:text-5xl">
                    Browse fish with faster filtering and cleaner decisions.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    Search by species, narrow by category, and spot stock availability before you open a product page.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">{products.length}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Products</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">{inStockCount}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">In stock</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">{featuredCount}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Top rated</p>
                </div>
              </div>
            </div>
          </section>

          <section className="sticky top-0 z-10 mb-2 rounded-3xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-xl md:px-5">
            <div className="grid gap-3 lg:grid-cols-[1.25fr_repeat(5,minmax(0,1fr))_auto] lg:items-end">
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Search</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by fish name or scientific name"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                  />
                </div>
              </label>

              <div className="shrink-0">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Sort</span>
                <div className="relative">
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-300 focus:bg-white"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating-desc">Top Rated</option>
                    <option value="name-asc">Name: A to Z</option>
                  </select>
                </div>
              </div>

              <div className="shrink-0">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Category</span>
                <div className="relative">
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-300 focus:bg-white"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSubcategory('All');
                    }}
                  >
                    {categoriesList.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="shrink-0">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Type</span>
                <div className="relative">
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-300 focus:bg-white"
                    value={waterType}
                    onChange={(e) => setWaterType(e.target.value)}
                  >
                    {waterTypesList.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="shrink-0">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Tag</span>
                <div className="relative">
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-300 focus:bg-white"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  >
                    {tagsList.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="shrink-0">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Subcategory</span>
                <select
                  className="h-12 min-w-44 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  disabled={category === 'All'}
                >
                  {subcategoriesList.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => setInStockOnly((value) => !value)}
                  className={`inline-flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                    inStockOnly
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${inStockOnly ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  In stock only
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                >
                  <X className="h-4 w-4" /> Clear
                </button>
              </div>
            </div>
          </section>

          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">
              {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} visible
            </p>
            {activeFilterCount > 0 && (
              <p className="text-sm font-medium text-blue-700">
                {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-500">Loading products...</p>
            </div>
          )}

          {!isLoading && loadError && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <p className="text-sm font-semibold text-rose-600">{loadError}</p>
              <button
                onClick={fetchProducts}
                className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !loadError && filteredProducts.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="mb-4 rounded-full border border-slate-100 bg-white p-4 shadow-sm">
                <Search className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="mb-1 font-bold text-slate-800">No products found</h3>
              <p className="max-w-50 text-sm text-slate-500">Try adjusting your filters or searching for something else.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-24 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const rating = Number(product.rating) || 0;

                return (
                  <Link
                    href={`/products/${product._id}`}
                    key={product._id}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="relative aspect-4/5 overflow-hidden bg-linear-to-br from-slate-50 to-slate-100">
                      <img
                        src={product.images?.[0] ?? 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'}
                        alt={product.title}
                        className="absolute inset-0 h-full w-full object-contain p-5 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                      />

                      <div className="absolute left-3 top-3 flex flex-col gap-2">
                        {product.tag && (
                          <span className="inline-flex w-fit items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm backdrop-blur">
                            {product.tag}
                          </span>
                        )}
                        {!product.inStock && (
                          <span className="inline-flex w-fit items-center rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
                            Sold out
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm backdrop-blur transition-colors hover:text-rose-500"
                      >
                        <Heart className="h-4 w-4" />
                      </button>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Price</p>
                          <p className="text-lg font-black text-slate-950">{formatPrice(product.price)}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(product);
                          }}
                          disabled={!product.inStock}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{product.category}</p>
                          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-950 group-hover:text-blue-700 md:text-base">
                            {product.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {rating.toFixed(1)}
                        </div>
                      </div>

                      <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                        {product.scientific ?? 'Aquatic premium stock'}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs font-semibold text-slate-500">
                        <span>{product.waterType}</span>
                        <span>{product.subcategory ?? 'Standard care'}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
