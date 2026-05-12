"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  Search, Heart, X, SlidersHorizontal, ArrowUpDown, 
  Star, ArrowDown, ShieldCheck, Truck, Headset 
} from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';
import { getSubcategoriesForCategory } from '@/lib/catalog';

const formatPrice = (price: number) => `₹${price}`;

const extractProducts = (payload: unknown): MarketplaceProduct[] => {
  if (Array.isArray(payload)) return payload as MarketplaceProduct[];
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as { products?: unknown; data?: { products?: unknown } };
  if (Array.isArray(data.products)) return data.products as MarketplaceProduct[];
  if (Array.isArray(data.data?.products)) return data.data.products as MarketplaceProduct[];
  return [];
};

export default function ProductsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [category, setCategory] = useState('All');
  const [subcategory, setSubcategory] = useState('All');
  const [waterType, setWaterType] = useState('All');
  const [tag, setTag] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load products');
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

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('featured');
    setCategory('All');
    setSubcategory('All');
    setWaterType('All');
    setTag('All');
    setInStockOnly(false);
  };

  const categoriesList = useMemo(() => ['All', ...Array.from(new Set([...availableCategories, ...products.map((p) => p.category)]))], [availableCategories, products]);
  const subcategoriesList = useMemo(() => (category === 'All' ? ['All'] : ['All', ...getSubcategoriesForCategory(category)]), [category]);
  const waterTypesList = useMemo(() => ['All', ...Array.from(new Set(products.map((p) => p.waterType)))], [products]);
  const tagsList = useMemo(() => ['All', ...Array.from(new Set(products.map((p) => p.tag).filter(Boolean)))], [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const titleMatch = product.title?.toLowerCase().includes(normalizedQuery) || false;
      const scientificMatch = product.scientific?.toLowerCase().includes(normalizedQuery) || false;
      const tagMatch = (product.tag ?? '').toLowerCase().includes(normalizedQuery) || false;

      const matchesSearch = normalizedQuery.length === 0 || titleMatch || scientificMatch || tagMatch;
      const matchesCategory = category === 'All' || product.category === category;
      const matchesSubcategory = subcategory === 'All' || !subcategory || product.subcategory === subcategory;
      const matchesWaterType = waterType === 'All' || product.waterType === waterType;
      const matchesTag = tag === 'All' || (product.tag ?? '') === tag;
      const matchesStock = !inStockOnly || product.inStock;

      return matchesSearch && matchesCategory && matchesSubcategory && matchesWaterType && matchesTag && matchesStock;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name-asc': return a.title.localeCompare(b.title);
        case 'rating-desc': return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        default: return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
    });

    return filtered;
  }, [products, searchTerm, category, subcategory, waterType, tag, inStockOnly, sortBy]);

  // Prevent background scrolling when mobile modal is open
  useEffect(() => {
    if (filterModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [filterModalOpen]);

  // Helper to generate fake review count based on string length to simulate UI
  const getFakeReviewCount = (str: string) => (str.length * 7 + 12);

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 pb-safe pb-24 font-sans w-full overflow-x-hidden selection:bg-blue-200">
      
      {/* Sticky Filter & Sort Bar (now top-0 since header is removed) */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-700 shadow-sm">
        <button 
          onClick={() => setFilterModalOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-colors"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
        
        <span className="text-slate-500 font-medium">
          {filteredProducts.length} Products
        </span>

        <button 
          onClick={() => setFilterModalOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-colors"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort
        </button>
      </div>

      <main className="p-3 sm:p-4">
        {/* Search Bar relocated to main content area to preserve functionality */}
        <div className="mb-4 relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full h-11 rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#064ee5] focus:ring-1 focus:ring-[#064ee5]"
          />
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-24 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#064ee5]" />
          </div>
        )}

        {!isLoading && loadError && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-rose-500 mb-4">{loadError}</p>
            <button onClick={fetchProducts} className="h-10 rounded-full bg-[#064ee5] px-6 text-sm font-bold text-white">
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !loadError && filteredProducts.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center px-4">
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
              <Search className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500">Try adjusting your filters or searching for something else.</p>
          </div>
        ) : (
          <>
            {/* 2-column Grid Matching Mockup */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {filteredProducts.map((product) => {
                const rating = Number(product.rating) || 4.2;
                const reviewCount = getFakeReviewCount(product._id || product.title);
                const unitPrice = typeof product.perPairPrice === 'number'
                  ? product.perPairPrice
                  : (typeof product.perPiecePrice === 'number' ? product.perPiecePrice : null);
                const unitLabel = typeof product.perPairPrice === 'number' ? 'pair' : 'piece';

                return (
                  <Link
                    href={`/products/${product._id}`}
                    key={product._id}
                    className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 active:scale-[0.98] transition-transform"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      <img
                        src={product.images?.[0] ?? 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'}
                        alt={product.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />

                      {/* Out of Stock Badge (Replaced Standard Tags with this essential alert) */}
                      {!product.inStock && (
                        <div className="absolute left-2 top-2 rounded bg-slate-900/90 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white backdrop-blur-sm">
                          Sold out
                        </div>
                      )}

                      {/* Heart Icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          // Handle wishlist
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm active:text-rose-500 transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                      </button>

                      {/* Overlaid Rating Pill */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                        <span>{rating.toFixed(1)}</span>
                        <Star className="h-2.5 w-2.5 fill-[#159e4b] text-[#159e4b]" />
                        <span className="text-slate-300 font-normal">|</span>
                        <span className="text-slate-500 font-medium">{reviewCount}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-1 flex-col p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#064ee5]">
                          {product.category || 'Freshwater Fish'}
                        </h4>

                        <div className="w-max rounded bg-[#e7f8ef] px-1.5 py-0.5 text-[10px] font-bold text-[#159e4b]">
                          {product.price < 500 ? 'Hot Deal' : 'Lowest price since launch'}
                        </div>
                      </div>
                      
                      <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-900">
                        {product.title}
                      </h3>

                      {/* Pricing Row */}
                      <div className="mt-1.5 flex flex-col gap-0.5 text-[11px] text-slate-600 font-sans">
                        {unitPrice != null ? (
                          <span><span className="font-semibold text-slate-900">₹{unitPrice}</span> per {unitLabel}</span>
                        ) : (
                          <span className="text-slate-400">Pricing not set</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            
          </>
        )}
      </main>

      {/* Unified Filter & Sort Bottom Sheet */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="flex-1 w-full" onClick={() => setFilterModalOpen(false)} />
          
          <div className="w-full flex flex-col max-h-[85vh] rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom shrink-0">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Filter & Sort</h2>
              <button 
                onClick={() => setFilterModalOpen(false)} 
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              <div className="space-y-4">
                {/* Sort */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Sort By</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none" 
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
                
                {/* Categories */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
                    <select 
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none" 
                      value={category} 
                      onChange={(e) => { setCategory(e.target.value); setSubcategory('All'); }}
                    >
                      {categoriesList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Subcategory</label>
                    <select 
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none disabled:opacity-50" 
                      value={subcategory} 
                      onChange={(e) => setSubcategory(e.target.value)} 
                      disabled={category === 'All'}
                    >
                      {subcategoriesList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Water Type</label>
                    <select 
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none" 
                      value={waterType} 
                      onChange={(e) => setWaterType(e.target.value)}
                    >
                      {waterTypesList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tag</label>
                    <select 
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none" 
                      value={tag} 
                      onChange={(e) => setTag(e.target.value)}
                    >
                      {tagsList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>

                {/* Switch */}
                <div className="pt-2">
                  <label className="flex items-center justify-between cursor-pointer rounded-xl border border-slate-200 p-3.5 active:bg-slate-50">
                    <span className="text-sm font-bold text-slate-900">In-stock only</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inStockOnly}
                      onClick={() => setInStockOnly((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${inStockOnly ? 'bg-[#064ee5]' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inStockOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-5 py-4 bg-white pb-safe">
              <button 
                type="button" 
                onClick={clearFilters} 
                className="flex-1 h-11 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-900 active:bg-slate-50"
              >
                Clear All
              </button>
              <button 
                type="button" 
                onClick={() => setFilterModalOpen(false)} 
                className="flex-2 h-11 rounded-full bg-[#064ee5] text-sm font-bold text-white active:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}