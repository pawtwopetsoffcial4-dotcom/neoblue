"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Heart, ChevronDown, Share } from 'lucide-react';
import MobileDock from '../components/MobileDock';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';

const formatPrice = (price: number) => `₹${price}`;

export default function ProductsPage() {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
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

  const categoriesList = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.category)))],
    [products]
  );
  const waterTypesList = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.waterType)))],
    [products]
  );
  const tagsList = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.tag || 'Standard')))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const titleMatch = product.title?.toLowerCase().includes(normalizedQuery) || false;
      const scientificMatch = product.scientific?.toLowerCase().includes(normalizedQuery) || false;
      const tagMatch = (product.tag || 'Standard').toLowerCase().includes(normalizedQuery) || false;

      const matchesSearch =
        normalizedQuery.length === 0 || titleMatch || scientificMatch || tagMatch;

      const matchesCategory = category === 'All' || product.category === category;
      const matchesWaterType = waterType === 'All' || product.waterType === waterType;
      const matchesTag = tag === 'All' || (product.tag || 'Standard') === tag;
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans selection:bg-blue-100">
      {/* Top Header - Mobile App Like */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 -ml-1.5 text-slate-700 hover:text-slate-900 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">All Products</h1>
            <button className="text-[11px] text-blue-600 font-bold flex items-center gap-1 uppercase tracking-wide mt-0.5">
              Delivering to : Home <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <Link href="/auth/login" className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-blue-700 transition-colors">
              Login
            </Link>
          )}
          <button className="p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-full text-slate-700">
            <Search className="h-4 w-4" />
          </button>
          <button className="p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-full text-slate-700">
            <Share className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Layout - Content Only */}
      <div className="flex h-[calc(100vh-65px)] overflow-hidden">
        
        {/* Main Content Area */}
        <main className="flex-1 bg-[#F5F7FA] overflow-y-auto px-4 py-4">
          
          {/* Filters Bar */}
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-4 mb-2 sticky top-0 bg-[#F5F7FA] z-10 -mx-4 px-4">
            <button className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-blue-200 transition-colors rounded-lg text-sm font-semibold text-slate-700 shadow-sm">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" /> Filters <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            <div className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-blue-200 transition-colors rounded-lg text-sm font-semibold text-slate-700 shadow-sm relative">
              <span className="text-[11px] text-blue-500">↑↓</span> Sort <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              <select className="absolute opacity-0 inset-0 w-full cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                 <option value="featured">Featured</option>
                 <option value="price-asc">Price: Low to High</option>
                 <option value="price-desc">Price: High to Low</option>
                 <option value="rating-desc">Top Rated</option>
              </select>
            </div>
            <button className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-blue-200 transition-colors rounded-lg text-sm font-semibold text-slate-700 shadow-sm relative">
              Type <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
               <select className="absolute opacity-0 inset-0 w-full cursor-pointer" value={waterType} onChange={(e) => setWaterType(e.target.value)}>
                {waterTypesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </button>
          </div>

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm font-medium">Loading products...</p>
            </div>
          )}

          {!isLoading && !loadError && filteredProducts.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-full mb-4 shadow-sm border border-slate-100">
                <Search className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-slate-800 font-bold mb-1">No products found</h3>
              <p className="text-slate-500 text-sm max-w-[200px]">Try adjusting your filters or searching for something else.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-24">
              {filteredProducts.map((product) => (
                <Link
                  href={`/products/${product._id}`}
                  key={product._id}
                  className="flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] transition-all duration-300 group relative"
                >
                  {/* Image Section */}
                  <div className="relative aspect-square bg-gradient-to-b from-slate-50 to-slate-100/50 p-5 flex flex-col justify-center items-center">
                    <img
                      src={product.images?.[0] ?? 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'}
                      alt={product.title}
                      className="absolute inset-0 h-full w-full object-contain mix-blend-multiply group-hover:scale-110 p-4 transition-transform duration-500 ease-out"
                    />
                    
                    {/* Favorite Button */}
                    <div className="absolute top-2 right-2 z-20">
                      <button className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all pointer-events-auto" onClick={(e) => { e.preventDefault(); }}>
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Stock badge */}
                    {!product.inStock && (
                      <span className="absolute top-3 left-3 z-10 rounded-md bg-slate-800/90 backdrop-blur-md px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm">
                        Out of stock
                      </span>
                    )}

                    {/* Quick Add Button */}
                    <div className="absolute -bottom-3.5 z-20 w-full px-4 flex justify-center pointer-events-auto">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        className="h-8 w-24 bg-white border border-green-200 rounded-lg text-green-600 font-bold uppercase tracking-wider text-[11px] shadow-[0_4px_10px_-2px_rgba(22,163,74,0.15)] hover:bg-green-50 hover:border-green-300 transition-all flex items-center justify-center"
                      >
                        ADD
                      </button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3.5 pt-6 flex flex-col flex-grow z-10 pointer-events-none bg-white">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">
                      {product.category}
                    </span>
                    
                    <h2 className="text-[13px] md:text-sm font-semibold text-slate-800 leading-snug line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                      {product.title}
                    </h2>
                    
                    <div className="mt-auto flex items-baseline gap-2">
                      <p className="text-[15px] font-black text-slate-900 tracking-tight">
                        {formatPrice(product.price)}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 line-through">
                        MRP {formatPrice(product.price * 1.25)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <MobileDock />
      </div>
    </div>
  );
}