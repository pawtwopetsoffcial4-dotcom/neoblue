"use client";

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
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
import ComingSoonPlants from '@/app/components/ComingSoonPlants';

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

function ProductsPageContent() {
  const { addToCart } = useCart();
  const { mode } = useMode();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || '';

  useEffect(() => {
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [urlSearchTerm]);

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

  if (mode === 'plants') {
    return (
      <div className="min-h-screen pb-safe pb-24 font-sans w-full overflow-x-hidden transition-colors duration-500 bg-[#f5f8f6] text-slate-900 selection:bg-green-200">
        <ComingSoonPlants />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-safe pb-24 font-sans w-full overflow-x-hidden transition-colors duration-500 bg-[#f5f6f8] text-slate-900 selection:bg-blue-200`}>
      
      {/* Integrated Search & Filter Toolbar */}
      <div className={`w-full bg-white border-b py-2.5 px-3 sm:px-6 transition-all ${
        mode === 'fishes' ? 'border-blue-100 shadow-sm' : 'border-emerald-100 shadow-sm'
      }`}>
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          {/* Search Input Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={mode === 'fishes' ? "Search for fishes, species, or tags..." : "Search for plants, moss, or accessories..."}
              className={`w-full h-9.5 rounded-full border border-slate-200/90 bg-slate-50/80 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:bg-white focus:ring-2 ${
                mode === 'fishes' ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
          </div>

          {/* Controls: Filter Button & Sort Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
            <button 
              onClick={() => setFilterModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                mode === 'fishes' ? 'hover:border-blue-400 hover:text-blue-600' : 'hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>

            <button 
              onClick={() => setFilterModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                mode === 'fishes' ? 'hover:border-blue-400 hover:text-blue-600' : 'hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Sort</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-12">

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
            {/* Responsive Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 mb-12">
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
                    className={`group flex w-full flex-col overflow-hidden rounded-[24px] bg-white shadow-sm border border-slate-100 active:scale-[0.98] animate-fade-in-up hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 ease-out ${
                      mode === 'fishes' ? 'hover:border-blue-200' : 'hover:border-green-200'
                    }`}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-slate-50">
                      <Image
                        src={product.images?.[0] ?? (mode === 'fishes' ? DEFAULT_IMAGE : '/fishes_cat_cover/Plants.png')}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />

                      {/* Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Out of Stock Badge */}
                      {!product.inStock && (
                        <div className="absolute left-3 top-3 rounded-full bg-slate-900/95 px-3 py-1 text-[10px] md:text-xs font-extrabold uppercase tracking-widest text-white backdrop-blur-md shadow-lg">
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
                        className={`absolute right-3 top-3 flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:bg-white ${
                          wishlistedIds.includes(product._id)
                            ? 'text-rose-500 scale-110 shadow-md'
                            : 'text-slate-400 hover:text-rose-500 hover:scale-110'
                        }`}
                      >
                        <Heart className={`h-4 w-4 md:h-4.5 md:w-4.5 ${wishlistedIds.includes(product._id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-1 flex-col p-4 md:p-5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest ${
                          mode === 'fishes' ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {product.category || (mode === 'fishes' ? 'Freshwater Fish' : 'Plants')}
                        </h4>

                        <div className={`w-max rounded-full px-2 py-0.5 text-[9px] md:text-[10px] font-bold ${
                          mode === 'fishes' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {mode === 'fishes' ? (product.price < 500 ? 'Hot Deal' : 'Premium') : '18% GST Applied'}
                        </div>
                      </div>
                      
                      <h3 className="line-clamp-2 text-sm md:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {product.title}
                      </h3>

                      {/* Rating Row */}
                      <div className="mt-2.5 flex items-center">
                        <ReviewStars rating={rating} count={reviewsCount} compact size={13} />
                      </div>

                      {/* Pricing Row */}
                      <div className="mt-auto pt-4 flex flex-col gap-0.5 text-xs md:text-sm text-slate-500 font-medium">
                        {unitPrice != null ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">₹{unitPrice}</span>
                            <span>/ {unitLabel}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pricing not set</span>
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

      {/* Unified Filter & Sort Modal / Bottom Sheet */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center items-center bg-slate-900/60 backdrop-blur-sm transition-opacity p-0 md:p-6">
          <div className="absolute inset-0 w-full h-full" onClick={() => setFilterModalOpen(false)} />
          
          <div className="relative w-full md:max-w-xl flex flex-col max-h-[85vh] md:max-h-[80vh] rounded-t-3xl md:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 shrink-0 overflow-hidden">
            <div className="flex md:hidden justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-slate-200" />
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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}