"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, Heart, X, SlidersHorizontal, ArrowUpDown, 
  Star, ArrowDown, ShieldCheck, Truck, Headset 
} from 'lucide-react';
import ReviewStars from '@/app/components/ReviewStars';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';
import { getSubcategoriesForCategory } from '@/lib/catalog';
import { useMode } from '@/lib/hooks/useMode';

const formatPrice = (price: number) => `₹${price}`;

const DEFAULT_IMAGE = 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg';

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
  const { mode } = useMode();
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
  const [wishlistedIds, setWishlistedIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('neoblue_wishlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlistedIds(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleWishlist = (productId: string) => {
    setWishlistedIds((current) => {
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      localStorage.setItem('neoblue_wishlist', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    document.title = mode === 'fishes' ? "Fishes & Live Stock | NeoBlue" : "Aquarium Plants & Moss | NeoBlue";
  }, [mode]);

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
      setLoadError(mode === 'fishes' ? 'Unable to load fishes right now. Please try again.' : 'Unable to load plants right now. Please try again.');
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

  // Whenever the global mode changes, reset category filters to prevent cross-mode filter leakage
  useEffect(() => {
    setCategory('All');
    setSubcategory('All');
  }, [mode]);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('featured');
    setCategory('All');
    setSubcategory('All');
    setWaterType('All');
    setTag('All');
    setInStockOnly(false);
  };

  // Dynamically compute filters depending on active mode
  const categoriesList = useMemo(() => {
    const rawCategories = Array.from(new Set([...availableCategories, ...products.map((p) => p.category)]));
    if (mode === 'fishes') {
      return ['All', ...rawCategories.filter((cat) => cat !== 'Plants')];
    } else {
      return ['All', ...rawCategories.filter((cat) => cat === 'Plants')];
    }
  }, [availableCategories, products, mode]);

  const subcategoriesList = useMemo(() => {
    if (category === 'All') {
      if (mode === 'plants') {
        return ['All', ...getSubcategoriesForCategory('Plants')];
      }
      return ['All'];
    }
    return ['All', ...getSubcategoriesForCategory(category)];
  }, [category, mode]);

  const waterTypesList = useMemo(() => {
    const subset = products.filter((p) => mode === 'fishes' ? p.category !== 'Plants' : p.category === 'Plants');
    return ['All', ...Array.from(new Set(subset.map((p) => p.waterType)))];
  }, [products, mode]);

  const tagsList = useMemo(() => {
    const subset = products.filter((p) => mode === 'fishes' ? p.category !== 'Plants' : p.category === 'Plants');
    return ['All', ...Array.from(new Set(subset.map((p) => p.tag).filter(Boolean)))];
  }, [products, mode]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const filtered = products.filter((product) => {
      // Enforce total isolation: no plant products in fishes mode, and no fish products in plants mode
      if (mode === 'fishes' && product.category === 'Plants') return false;
      if (mode === 'plants' && product.category !== 'Plants') return false;

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
  }, [products, searchTerm, category, subcategory, waterType, tag, inStockOnly, sortBy, mode]);

  return (
    <div className={`min-h-screen pb-safe pb-24 font-sans w-full overflow-x-hidden transition-colors duration-500 ${
      mode === 'fishes' ? 'bg-[#f5f6f8] text-slate-900 selection:bg-blue-200' : 'bg-[#f5f8f6] text-slate-900 selection:bg-green-200'
    }`}>
      
      {/* Sticky Filter & Sort Bar */}
      <div className="sticky top-[72px] z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-700 shadow-sm">
        <button 
          onClick={() => setFilterModalOpen(true)}
          className={`flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 transition-colors ${
            mode === 'fishes' ? 'hover:bg-slate-50 hover:text-blue-600' : 'hover:bg-green-50 hover:text-green-700'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
        
        <span className="text-slate-500 font-medium">
          {filteredProducts.length} {mode === 'fishes' ? 'Fishes' : 'Plants'}
        </span>

        <button 
          onClick={() => setFilterModalOpen(true)}
          className={`flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 transition-colors ${
            mode === 'fishes' ? 'hover:bg-slate-50 hover:text-blue-600' : 'hover:bg-green-50 hover:text-green-700'
          }`}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort
        </button>
      </div>

      <main className="p-3 sm:p-4">
        {/* Search Bar */}
        <div className="mb-4 relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={mode === 'fishes' ? "Search fishes..." : "Search plants..."}
            className={`w-full h-11 rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-1 ${
              mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
            }`}
          />
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-24 flex justify-center">
            <LoadingSpinner size={48} label={mode === 'fishes' ? "Loading Fishes..." : "Loading Plants..."} />
          </div>
        )}

        {!isLoading && loadError && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-rose-500 mb-4">{loadError}</p>
            <button 
              onClick={fetchProducts} 
              className={`h-10 rounded-full px-6 text-sm font-bold text-white transition-colors ${
                mode === 'fishes' ? 'bg-[#064ee5] hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !loadError && filteredProducts.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center px-4">
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
              <Search className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900">
              No {mode === 'fishes' ? 'fishes' : 'plants'} found
            </h3>
            <p className="text-xs text-slate-500">Try adjusting your filters or searching for something else.</p>
          </div>
        ) : (
          <>
            {/* 2-column Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {filteredProducts.map((product, idx) => {
                const rating = typeof product.rating === 'number' ? product.rating : 5;
                const reviewsCount = product.reviewsCount ?? 0;
                const unitPrice = typeof product.perPairPrice === 'number'
                  ? product.perPairPrice
                  : (typeof product.perPiecePrice === 'number' ? product.perPiecePrice : null);
                const unitLabel = typeof product.perPairPrice === 'number' ? 'pair' : 'piece';

                return (
                  <Link
                    href={`/products/${product._id}`}
                    key={product._id}
                    style={{ animationDelay: `${idx * 45}ms` }}
                    className={`group flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 active:scale-[0.98] animate-fade-in-up hover:-translate-y-1.5 hover:shadow-md hover:shadow-slate-350/20 transition-all duration-500 ease-out ${
                      mode === 'fishes' ? 'hover:ring-blue-300' : 'hover:ring-green-300'
                    }`}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      <Image
                        src={product.images?.[0] ?? (mode === 'fishes' ? DEFAULT_IMAGE : '/fishes_cat_cover/Plants.png')}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      {/* Out of Stock Badge */}
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
                          e.stopPropagation();
                          toggleWishlist(product._id);
                        }}
                        className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 ${
                          wishlistedIds.includes(product._id)
                            ? 'text-rose-500 scale-110 shadow-md'
                            : 'text-slate-300 hover:text-rose-500 hover:scale-105'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${wishlistedIds.includes(product._id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-1 flex-col p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-[10px] font-bold uppercase tracking-wider ${
                          mode === 'fishes' ? 'text-[#064ee5]' : 'text-green-600'
                        }`}>
                          {product.category || (mode === 'fishes' ? 'Freshwater Fish' : 'Plants')}
                        </h4>

                        <div className={`w-max rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          mode === 'fishes' ? 'bg-[#e7f8ef] text-[#159e4b]' : 'bg-green-50 text-green-700'
                        }`}>
                          {mode === 'fishes' ? (product.price < 500 ? 'Hot Deal' : 'Lowest Price') : '18% GST Applied'}
                        </div>
                      </div>
                      
                      <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-900">
                        {product.title}
                      </h3>

                      {/* Rating Row */}
                      <div className="mt-1 flex items-center">
                        <ReviewStars rating={rating} count={reviewsCount} compact size={11} />
                      </div>

                      {/* Pricing Row */}
                      <div className="mt-2 flex flex-col gap-0.5 text-[11px] text-slate-600 font-sans">
                        {unitPrice != null ? (
                          <span><span className="text-2xl font-black text-slate-900">₹{unitPrice}</span> per {unitLabel}</span>
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
                    className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 ${
                      mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                    }`} 
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
                      className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 ${
                        mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                      }`} 
                      value={category} 
                      onChange={(e) => { setCategory(e.target.value); setSubcategory('All'); }}
                    >
                      {categoriesList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Subcategory</label>
                    <select 
                      className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 disabled:opacity-50 ${
                        mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                      }`} 
                      value={subcategory} 
                      onChange={(e) => setSubcategory(e.target.value)} 
                      disabled={category === 'All' && mode !== 'plants'}
                    >
                      {subcategoriesList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Water Type</label>
                    <select 
                      className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 ${
                        mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                      }`} 
                      value={waterType} 
                      onChange={(e) => setWaterType(e.target.value)}
                    >
                      {waterTypesList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tag</label>
                    <select 
                      className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 ${
                        mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                      }`} 
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        inStockOnly ? (mode === 'fishes' ? 'bg-[#064ee5]' : 'bg-green-600') : 'bg-slate-200'
                      }`}
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
                className={`flex-2 h-11 rounded-full text-sm font-bold text-white transition-colors ${
                  mode === 'fishes' ? 'bg-[#064ee5] hover:bg-blue-750' : 'bg-green-600 hover:bg-green-750'
                }`}
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