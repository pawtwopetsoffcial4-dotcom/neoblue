"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, ArrowUpDown, CheckCircle2, MapPin, Mail, Phone, ShoppingBag, Star, X, ChevronRight, Inbox } from 'lucide-react';
import { MarketplaceProduct } from '@/lib/types/marketplace';

interface Address {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  isDefault: boolean;
}

interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  slug?: string;
  isApproved: boolean;
  addresses?: Address[];
}

interface Props {
  vendor: Vendor;
  products: MarketplaceProduct[];
}

export default function VendorShopContent({ vendor, products }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWaterType, setSelectedWaterType] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  // Compute unique categories present in vendor's catalog
  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return ['All', ...Array.from(list)];
  }, [products]);

  // Find vendor default address for location label
  const vendorLocation = useMemo(() => {
    if (!vendor.addresses || vendor.addresses.length === 0) return null;
    const def = vendor.addresses.find((addr) => addr.isDefault) || vendor.addresses[0];
    return `${def.city}, ${def.state}`;
  }, [vendor.addresses]);

  // Handle client-side search, filtering, and sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.scientific?.toLowerCase().includes(query)
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 3. Water Type Filter
    if (selectedWaterType !== 'All') {
      result = result.filter((p) => p.waterType === selectedWaterType);
    }

    // 4. Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedWaterType, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedWaterType('All');
    setSortBy('featured');
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-600">Store</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-blue-600 font-bold">{vendor.name}</span>
        </div>

        {/* Premium Vendor Banner Header */}
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-950 p-6 text-white shadow-xl md:p-10 mb-8">
          {/* Neon background blurs */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            
            {/* Logo Avatar */}
            <div className="relative h-28 w-28 shrink-0 rounded-2xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur-md shadow-2xl flex items-center justify-center">
              {vendor.logo ? (
                <img src={vendor.logo} alt={`${vendor.name} logo`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-blue-200 tracking-wider">
                  {vendor.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              )}
            </div>

            {/* Vendor Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{vendor.name}</h1>
                  {vendor.isApproved && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold tracking-wider uppercase border border-blue-500/30">
                      <CheckCircle2 className="h-3 w-3 fill-blue-500/10" /> Verified Breeder
                    </span>
                  )}
                </div>
                {vendorLocation && (
                  <p className="text-xs font-semibold text-slate-300 flex items-center justify-center md:justify-start gap-1">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" /> {vendorLocation}
                  </p>
                )}
              </div>

              {/* Badges and metadata summary */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-xs font-bold ring-1 ring-white/10">
                  <ShoppingBag className="h-3.5 w-3.5 text-blue-300" /> {products.length} Active Listings
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold ring-1 ring-amber-500/20">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> 4.9 Rating
                </span>
              </div>

              {/* Contact Information */}
              <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-cyan-400" /> {vendor.email}
                </span>
                {vendor.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-cyan-400" /> {vendor.phone}
                  </span>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* Catalog Main Layout */}
        <div className="space-y-6">
          
          {/* Dynamic Search & Filtering Toolbar */}
          <div className="flex flex-col gap-4 bg-white rounded-2xl border border-slate-200/60 p-4 shadow-2xs">
            
            {/* Search, Sort and Water Type selection */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1fr] gap-4 items-center">
              
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search store catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-all bg-slate-50/50 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Water Type Filter Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/50 h-11">
                {['All', 'Freshwater', 'Saltwater', 'Brackish'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedWaterType(type)}
                    className={`flex-1 text-[11px] font-bold rounded-lg transition-all ${
                      selectedWaterType === type
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Sorting Selection */}
              <div className="relative">
                <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-11 pl-10 pr-8 rounded-xl border border-slate-200 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-semibold text-slate-600 bg-slate-50/50 focus:bg-white appearance-none cursor-pointer"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Rating: High to Low</option>
                </select>
              </div>

            </div>

            {/* Categories pills list */}
            {categories.length > 2 && (
              <div className="border-t border-slate-100 pt-3 flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
                  <SlidersHorizontal className="h-3 w-3" /> Categories:
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border ${
                        selectedCategory === cat
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Catalog Results Grid */}
          {filteredProducts.length === 0 ? (
            
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border border-dashed border-slate-300 bg-white">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <Inbox className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No varieties match your filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
                Try clearing your search query or choosing another category filter.
              </p>
              <button
                onClick={resetFilters}
                className="mt-5 h-9 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            
            /* Products Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const isPairPrice = product.perPairPrice != null && typeof product.perPairPrice === 'number';
                const hasDiscount = product.discountPercentage != null && product.discountPercentage > 0;
                
                return (
                  <Link
                    href={`/products/${product._id}`}
                    key={product._id}
                    className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Image Block */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-50 border-b border-slate-100">
                      <img
                        src={product.images?.[0] ?? '/illustrations/placeholder.png'}
                        alt={product.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Water type badge */}
                      <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[8px] font-extrabold tracking-wider uppercase backdrop-blur-md shadow-2xs ${
                        product.waterType === 'Freshwater'
                          ? 'bg-blue-500/80 text-white'
                          : product.waterType === 'Saltwater'
                          ? 'bg-cyan-500/80 text-white'
                          : 'bg-emerald-500/80 text-white'
                      }`}>
                        {product.waterType}
                      </span>

                      {/* Discount flag */}
                      {hasDiscount && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-black bg-rose-500 text-white shadow-2xs uppercase">
                          {product.discountPercentage}% Off
                        </span>
                      )}
                    </div>

                    {/* Metadata Details */}
                    <div className="flex flex-1 flex-col p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          {product.category}
                        </span>
                        {product.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                            ★ {product.rating}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {product.title}
                        </h3>
                        {product.scientific && (
                          <p className="text-[10px] font-medium text-slate-400 italic mt-0.5 line-clamp-1">
                            {product.scientific}
                          </p>
                        )}
                      </div>

                      {/* Pricing block */}
                      <div className="pt-1.5 flex items-baseline gap-1">
                        <span className="text-sm font-black text-slate-900">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          / {isPairPrice ? 'Pair' : 'Piece'}
                        </span>
                        {hasDiscount && product.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through font-semibold ml-1.5">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* View Button Footer */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-blue-600 mt-auto group-hover:text-blue-700">
                        <span>View Details</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </div>

                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
