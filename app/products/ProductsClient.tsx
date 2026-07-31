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
import ProductCard from '@/app/components/ProductCard';
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
  const [lightingRequirement, setLightingRequirement] = useState('All');
  const [co2Requirement, setCo2Requirement] = useState('All');
  const [placement, setPlacement] = useState('All');
  const [careDifficulty, setCareDifficulty] = useState('All');
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
    setLightingRequirement('All');
    setCo2Requirement('All');
    setPlacement('All');
    setCareDifficulty('All');
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
      
      const matchesLighting = lightingRequirement === 'All' || (product as any).lightingRequirement === lightingRequirement;
      const matchesCo2 = co2Requirement === 'All' || (product as any).co2Requirement === co2Requirement;
      const matchesPlacement = placement === 'All' || (product as any).placement === placement;
      const matchesDifficulty = careDifficulty === 'All' || (product as any).careDifficulty === careDifficulty;

      return matchesSearch && matchesCategory && matchesSubcategory && matchesWaterType && matchesTag && matchesStock && matchesLighting && matchesCo2 && matchesPlacement && matchesDifficulty;
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
  }, [products, searchTerm, category, subcategory, waterType, tag, inStockOnly, sortBy, mode, lightingRequirement, co2Requirement, placement, careDifficulty]);

  return (
    <div className={`min-h-screen pb-safe pb-24 font-sans w-full overflow-x-hidden transition-colors duration-500 ${mode === 'fishes' ? 'bg-[#f5f6f8] selection:bg-blue-200' : 'bg-[#f5f8f6] selection:bg-green-200'} text-slate-900`}>
      
      {/* Floating Glassmorphism Filters Capsule (Single Button - Authentic iOS Glass Feel) */}
      <div className="fixed bottom-[98px] md:bottom-8 left-1/2 -translate-x-1/2 z-[1050] animate-fade-in-up">
        <button
          onClick={() => setFilterModalOpen(true)}
          style={{
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            backdropFilter: 'blur(20px) saturate(180%)',
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/80 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1.5px_rgba(255,255,255,1)] text-slate-900 font-black text-xs tracking-wide transition-all active:scale-95 hover:bg-white/80 ${
            mode === 'fishes' ? 'hover:shadow-blue-500/15' : 'hover:shadow-emerald-500/15'
          }`}
        >
          <SlidersHorizontal className={`h-4 w-4 ${mode === 'fishes' ? 'text-blue-700' : 'text-emerald-800'}`} />
          <span>Filters</span>
        </button>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-0 pb-28">
        {/* Sticky Floating Search Bar (Touches header seamlessly) */}
        <div className="z-40 w-full drop-shadow-sm pt-2 mb-4 pointer-events-none">
          <div className="max-w-2xl   mx-auto relative pointer-events-auto">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500 z-10" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                backdropFilter: 'blur(20px) saturate(180%)',
              }}
              placeholder={mode === 'fishes' ? "Search for fishes, species, or tags..." : "Search for plants, moss, or accessories..."}
              className={`w-full h-[46px] rounded-full border border-white/80 bg-white/70 pl-11 pr-5 text-xs md:text-sm font-bold text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1.5px_rgba(255,255,255,1)] outline-none placeholder:text-slate-500 transition-all focus:bg-white/80 ${
                mode === 'fishes' ? 'focus:border-blue-400 focus:shadow-blue-500/15' : 'focus:border-emerald-400 focus:shadow-emerald-500/15'
              }`}
            />
          </div>
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
            {/* Responsive Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 mb-12">
              {filteredProducts.map((product, idx) => {
                return <ProductCard key={product._id} product={product} idx={idx} />;
              })}
            </div>
          </>
        )}
      </main>

      {/* Unified Filter & Sort Modal / Bottom Sheet */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:justify-center items-center bg-slate-900/60 backdrop-blur-sm transition-opacity p-0 md:p-6">
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

                {/* Plant Filters */}
                {mode === 'plants' && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Lighting</label>
                      <select 
                        className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:border-green-600 focus:ring-green-600`}
                        value={lightingRequirement} 
                        onChange={(e) => setLightingRequirement(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">CO2</label>
                      <select 
                        className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:border-green-600 focus:ring-green-600`}
                        value={co2Requirement} 
                        onChange={(e) => setCo2Requirement(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="None">None</option>
                        <option value="Recommended">Recommended</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Placement</label>
                      <select 
                        className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:border-green-600 focus:ring-green-600`}
                        value={placement} 
                        onChange={(e) => setPlacement(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Foreground">Foreground</option>
                        <option value="Midground">Midground</option>
                        <option value="Background">Background</option>
                        <option value="Floating">Floating</option>
                        <option value="Epiphyte">Epiphyte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Difficulty</label>
                      <select 
                        className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:border-green-600 focus:ring-green-600`}
                        value={careDifficulty} 
                        onChange={(e) => setCareDifficulty(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Easy">Easy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                )}

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