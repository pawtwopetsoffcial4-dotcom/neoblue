"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, Truck, Shield, Droplets, Thermometer, Info, MessageSquare, ChevronRight, Heart, Share2, Store, CheckCircle2, Search, X, ShieldAlert } from 'lucide-react';
import ReviewList from '@/app/components/ReviewList';
import ReviewForm from '@/app/components/ReviewForm';
import ReviewStars from '@/app/components/ReviewStars';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';

type Props = {
  productId: string;
  initialProduct: MarketplaceProduct;
  initialReviews: any[];
  initialRecommendations: MarketplaceProduct[];
  allProducts: Array<{ _id: string; title: string; scientific?: string; category: string; temperament?: string }>;
};

const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

export default function ProductClientPage({
  productId,
  initialProduct,
  initialReviews,
  initialRecommendations,
  allProducts,
}: Props) {
  const [product, setProduct] = useState<MarketplaceProduct>(initialProduct);
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'faq' | 'reviews'>('description');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { addToCart } = useCart();
  const [tankPh, setTankPh] = useState(7.0);
  const [tankTemp, setTankTemp] = useState(24);
  const [selectedMates, setSelectedMates] = useState<string[]>([]);
  const [mateSearchQuery, setMateSearchQuery] = useState('');
  const [showMatesDropdown, setShowMatesDropdown] = useState(false);

  const refetchProductStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (data.product) {
        setProduct(data.product);
      }
    } catch (err) {
      console.error('Failed to refetch product stats:', err);
    }
  }, [productId]);

  const refetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/${productId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const body = await res.json();
      setReviews(Array.isArray(body.reviews) ? body.reviews : []);
    } catch (err) {
      console.error('Failed to refetch reviews:', err);
    }
  }, [productId]);

  const searchResults = useMemo(() => {
    if (!mateSearchQuery.trim()) {
      return allProducts.filter(p => p._id !== product?._id && !selectedMates.includes(p._id));
    }
    const query = mateSearchQuery.toLowerCase();
    return allProducts.filter(
      p =>
        p._id !== product?._id &&
        !selectedMates.includes(p._id) &&
        (p.title.toLowerCase().includes(query) || (p.scientific && p.scientific.toLowerCase().includes(query)))
    );
  }, [allProducts, selectedMates, mateSearchQuery, product?._id]);

  const compatibilityData = useMemo(() => {
    const specPhMin = product.phMin ?? 6.0;
    const specPhMax = product.phMax ?? 8.0;
    const specTempMin = product.tempMin ?? 20;
    const specTempMax = product.tempMax ?? 30;
    const specTemperament = product.temperament ?? 'Peaceful';

    const phMismatch = tankPh < specPhMin || tankPh > specPhMax;
    const tempMismatch = tankTemp < specTempMin || tankTemp > specTempMax;

    const activeMates = allProducts.filter(p => selectedMates.includes(p._id));
    
    let aggressiveConflict = false;
    let aggressiveTankmateConflict = false;
    let warningMates: string[] = [];
    let semiAggressiveDispute = false;

    if (specTemperament === 'Aggressive' && activeMates.length > 0) {
      aggressiveConflict = true;
    }

    activeMates.forEach(mate => {
      const mateTemp = mate.temperament ?? 'Peaceful';
      if (mateTemp === 'Aggressive') {
        aggressiveTankmateConflict = true;
      }
      if (specTemperament === 'Semi-aggressive' && mateTemp === 'Peaceful') {
        warningMates.push(mate.title);
      }
      if (specTemperament === 'Peaceful' && mateTemp === 'Semi-aggressive') {
        warningMates.push(mate.title);
      }
      if (specTemperament === 'Semi-aggressive' && mateTemp === 'Semi-aggressive') {
        semiAggressiveDispute = true;
      }
    });

    let compatibilityRating: 'Green' | 'Orange' | 'Red' = 'Green';
    const alerts: string[] = [];

    if (aggressiveConflict) {
      compatibilityRating = 'Red';
      alerts.push(`Danger: Aggressive ${product.title} cannot be mixed with other tankmates.`);
    }
    if (aggressiveTankmateConflict) {
      compatibilityRating = 'Red';
      const aggMates = activeMates.filter(m => (m.temperament ?? 'Peaceful') === 'Aggressive').map(m => m.title);
      alerts.push(`Danger: Incompatible with existing aggressive species in your tank (${aggMates.join(', ')}).`);
    }

    const phDiff = Math.max(0, specPhMin - tankPh, tankPh - specPhMax);
    const tempDiff = Math.max(0, specTempMin - tankTemp, tankTemp - specTempMax);
    if (phDiff >= 1.5 || tempDiff >= 5) {
      compatibilityRating = 'Red';
      if (phDiff >= 1.5) alerts.push(`Danger: Severe pH mismatch (Diff: ${phDiff.toFixed(1)}). Extremely hazardous.`);
      if (tempDiff >= 5) alerts.push(`Danger: Severe temperature mismatch (Diff: ${tempDiff}°C). Extremely hazardous.`);
    } else {
      if (phMismatch && phDiff < 1.5) {
        if (compatibilityRating !== 'Red') compatibilityRating = 'Orange';
        alerts.push(`Warning: pH ${tankPh.toFixed(1)} is outside the ideal range (${specPhMin} - ${specPhMax}).`);
      }
      if (tempMismatch && tempDiff < 5) {
        if (compatibilityRating !== 'Red') compatibilityRating = 'Orange';
        alerts.push(`Warning: Temperature ${tankTemp}°C is outside the ideal range (${specTempMin}°C - ${specTempMax}°C).`);
      }
    }

    if (warningMates.length > 0) {
      if (compatibilityRating !== 'Red') compatibilityRating = 'Orange';
      if (specTemperament === 'Semi-aggressive') {
        alerts.push(`Caution: Semi-aggressive ${product.title} may harass peaceful tankmates (${warningMates.join(', ')}).`);
      } else {
        alerts.push(`Caution: Peaceful ${product.title} may be harassed by semi-aggressive tankmates (${warningMates.join(', ')}).`);
      }
    }
    if (semiAggressiveDispute) {
      if (compatibilityRating !== 'Red') compatibilityRating = 'Orange';
      alerts.push(`Caution: Multiple semi-aggressive species can trigger territorial disputes. Monitor closely.`);
    }

    if (compatibilityRating === 'Green' && alerts.length === 0) {
      alerts.push(`Specimen is fully compatible with your current tank parameters and species selection.`);
    }

    return { rating: compatibilityRating, alerts, activeMates };
  }, [product, tankPh, tankTemp, selectedMates, allProducts]);

  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'];
  const activeImage = productImages[Math.min(activeImageIndex, productImages.length - 1)];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* Image Gallery */}
      <div className="lg:col-span-7 -mx-4 sm:mx-0 flex flex-col gap-4">
        <div className="relative aspect-square w-full rounded-none sm:rounded-3xl bg-slate-900 sm:border sm:border-slate-100 sm:shadow-sm overflow-hidden group">
          <img
            src={activeImage}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
          />
          <div className="absolute top-6 left-6 flex flex-col gap-2">
            {product.tag && (
              <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider pill-neoblue-gradient text-white shadow-sm w-fit">
                {product.tag}
              </span>
            )}
            {!product.inStock && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500 text-white shadow-sm w-fit">
                Out of Stock
              </span>
            )}
          </div>
        </div>
        {/* Thumbnail placeholders */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {productImages.map((image, i) => (
            <button
              type="button"
              onClick={() => setActiveImageIndex(i)}
              key={`${image}-${i}`}
              className={`shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white border cursor-pointer overflow-hidden ${i === activeImageIndex ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300'} transition-all`}
            >
              <img src={image} alt="thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Product Info Setup */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-3">{product.category} • {product.waterType}</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-2">{product.title}</h1>
          <p className="text-lg text-slate-500 italic font-serif flex items-center gap-2">
            {product.scientific ?? 'Premium Aquatic Specimen'}
          </p>
          {(() => {
            const vendor = typeof product.vendorId === 'object' && product.vendorId !== null ? product.vendorId : null;
            if (!vendor) return null;
            const shopHref = vendor.slug ? `/shop/${vendor.slug}` : `/shop/${vendor._id}`;
            return (
              <div className="mt-3.5 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl py-2 px-3.5 w-fit">
                <Store className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Sold by:</span>
                <Link 
                  href={shopHref}
                  className="font-extrabold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  {vendor.name}
                </Link>
                <span className="text-slate-300">|</span>
                <Link 
                  href={shopHref}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  View Storefront
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })()}
          {/* Price & Cart Actions */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-6 mb-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex-1 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Pricing</p>
                <p className="text-4xl font-black text-slate-900 leading-none">{formatPrice(product.price)}</p>
                <div className="flex flex-col gap-1 text-sm text-slate-600">
                  {typeof product.perPairPrice === 'number' ? (
                    <span>
                      <span className="font-semibold text-slate-900">{formatPrice(product.perPairPrice)}</span> per pair
                    </span>
                  ) : typeof product.perPiecePrice === 'number' ? (
                    <span>
                      <span className="font-semibold text-slate-900">{formatPrice(product.perPiecePrice)}</span> per piece
                    </span>
                  ) : (
                    <span className="text-slate-400">Unit pricing will appear here when available.</span>
                  )}
                </div>
              </div>
              <p className="text-lg font-medium text-slate-400 line-through mb-1">{formatPrice(product.price * 1.25)}</p>
              <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                Save 20%
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center bg-[#F5F7FA] rounded-2xl p-1 border border-slate-200">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-slate-600 transition-colors shadow-sm"
                >-</button>
                <span className="w-12 text-center font-bold text-slate-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-slate-600 transition-colors shadow-sm"
                >+</button>
              </div>
              <button
                onClick={() => {
                  for (let i = 0; i < quantity; i++) product && addToCart(product);
                }}
                disabled={!product.inStock}
                className={`flex-1 h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                  ${product.inStock 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/25 active:scale-[0.98]' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                <ShoppingBag className="h-5 w-5" /> 
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">Live Delivery</span>
                  <span className="text-[10px] text-slate-500">100% Guarantee</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">Quality Checked</span>
                  <span className="text-[10px] text-slate-500">Quarantined</span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm md:text-base text-slate-600 leading-relaxed line-clamp-4">
            {product.description || 'Healthy, quarantine-tested livestock sourced for stable acclimation and long-term tank vitality.'}
          </p>
          
          {/* Ratings */}
          <div className="mt-4 flex items-center gap-2">
            <ReviewStars rating={product.rating} count={reviews.length} size={16} />
          </div>
        </div>

        {/* COMPATIBILITY CHECKER */}
        <div className="mb-8 rounded-3xl border border-blue-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🌡️</span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Compatibility Checker</h3>
          </div>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Verify if {product.title} matches your tank parameters and matches temperaments with your current tank inhabitants.
          </p>

          <div className="space-y-4">
            {/* Slider: pH */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Tank pH Level</span>
                <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">
                  {tankPh.toFixed(1)} pH
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5.0"
                  max="9.0"
                  step="0.1"
                  value={tankPh}
                  onChange={(e) => setTankPh(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">
                Ideal for specimen: <span className="font-bold text-slate-600">{(product.phMin ?? 6.0).toFixed(1)} - {(product.phMax ?? 8.0).toFixed(1)} pH</span>
              </p>
            </div>

            {/* Slider: Temp */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Tank Temperature</span>
                <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">
                  {tankTemp}°C
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="15"
                  max="35"
                  step="1"
                  value={tankTemp}
                  onChange={(e) => setTankTemp(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">
                Ideal for specimen: <span className="font-bold text-slate-600">{product.tempMin ?? 20}°C - {product.tempMax ?? 30}°C</span>
              </p>
            </div>

            {/* Species Selector */}
            <div className="space-y-1.5 pt-2 relative">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Current Inhabitants (Tankmates)</label>
              
              <div className="flex flex-wrap gap-1.5 mb-2">
                {compatibilityData.activeMates.map(mate => (
                  <span key={mate._id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                    {mate.title}
                    <button
                      type="button"
                      onClick={() => setSelectedMates(prev => prev.filter(id => id !== mate._id))}
                      className="w-3.5 h-3.5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 h-10 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search species..."
                  value={mateSearchQuery}
                  onChange={(e) => {
                    setMateSearchQuery(e.target.value);
                    setShowMatesDropdown(true);
                  }}
                  onFocus={() => setShowMatesDropdown(true)}
                  className="w-full h-full border-none outline-hidden bg-transparent text-sm"
                />
                {mateSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMateSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {showMatesDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-lg">
                  {searchResults.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setSelectedMates(prev => [...prev, p._id]);
                        setMateSearchQuery('');
                        setShowMatesDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span>{p.title}</span>
                        <span className="text-[10px] text-slate-400 block">{p.scientific || p.category}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase font-bold">
                        {p.temperament || 'Peaceful'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {showMatesDropdown && searchResults.length === 0 && mateSearchQuery && (
                <div className="absolute left-0 right-0 z-20 mt-1 rounded-2xl border border-slate-100 bg-white p-4 text-center text-xs text-slate-400 shadow-lg">
                  No species found.
                </div>
              )}
              {showMatesDropdown && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMatesDropdown(false)}
                />
              )}
            </div>

            {/* Calculations Result Block */}
            <div className={`mt-5 p-4 rounded-2xl border transition-all ${
              compatibilityData.rating === 'Green' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' :
              compatibilityData.rating === 'Orange' ? 'bg-amber-50/50 border-amber-100 text-amber-800' :
              'bg-rose-50/50 border-rose-100 text-rose-800'
            }`}>
              <div className="flex items-center gap-2 mb-2.5">
                {compatibilityData.rating === 'Green' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : compatibilityData.rating === 'Orange' ? (
                  <Info className="w-5 h-5 text-amber-500 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                )}
                <span className="text-xs font-black uppercase tracking-wider">
                  Verdict:{' '}
                  <span className={`font-black ${
                    compatibilityData.rating === 'Green' ? 'text-emerald-700' :
                    compatibilityData.rating === 'Orange' ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {compatibilityData.rating === 'Green' ? 'Compatible Setup' :
                     compatibilityData.rating === 'Orange' ? 'Caution Needed' : 'Danger - Incompatible'}
                  </span>
                </span>
              </div>

              <ul className="space-y-1.5 text-xs pl-1 font-medium list-none">
                {compatibilityData.alerts.map((alert, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-60" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Custom Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-2 border-b border-slate-200">
          {[
            { id: 'description', icon: Info, label: 'Description' },
            { id: 'specifications', icon: Thermometer, label: 'Care & Specs' },
            { id: 'faq', icon: MessageSquare, label: 'FAQ' },
            { id: 'reviews', icon: MessageSquare, label: `Reviews (${reviews.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 min-h-100">
          {activeTab === 'description' && (
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">About this {product.title}</h3>
              <div className="prose prose-slate prose-lg">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                
                <h4 className="text-xl font-bold text-slate-900 mt-10 mb-4">Why choose Neoblue?</h4>
                <ul className="space-y-3 mt-4">
                  {[
                    "All livestock undergoes a strict quarantine period before sale.",
                    "We ensure optimal water parameters and nutrition.",
                    "Expert advice available post-purchase to ensure a healthy transition."
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Care Requirements & Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Water Type", value: product.waterType, icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" },
                  { title: "Temperature", value: "24°C - 28°C", icon: Thermometer, color: "text-rose-500", bg: "bg-rose-50" },
                  { 
                    title: "Category", 
                    value: product.category, 
                    icon: Info, 
                    color: product.category === 'Plants' ? "text-green-600" : "text-indigo-500", 
                    bg: product.category === 'Plants' ? "bg-green-50" : "bg-indigo-50" 
                  },
                ].map((spec, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-[#F5F7FA] hover:border-slate-200 transition-colors">
                    <div className={`w-12 h-12 rounded-xl ${spec.bg} flex items-center justify-center shrink-0`}>
                      <spec.icon className={`h-6 w-6 ${spec.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">{spec.title}</p>
                      <p className="text-base font-bold text-slate-900 uppercase tracking-wide">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center w-24 h-24 bg-[#F5F7FA] rounded-3xl border border-slate-100">
                    <span className="text-3xl font-black text-slate-900">{product.rating.toFixed(1)}</span>
                    <div className="flex text-amber-400 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-3 w-3 ${star <= Math.round(product.rating) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Customer Reviews</h3>
                    <p className="text-slate-500">
                      Based on {reviews.length} {reviews.length === 1 ? 'certified purchase' : 'certified purchases'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowForm((s) => !s)} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors">
                  {showForm ? 'Close' : 'Write a Review'}
                </button>
              </div>

              <div className="space-y-6">
                {showForm && (
                  <div className="p-4 bg-[#fbfdff] rounded-2xl border border-slate-100">
                    <ReviewForm productId={productId} onSubmit={() => {
                      refetchReviews();
                      refetchProductStats();
                      setShowForm(false);
                    }} />
                  </div>
                )}

                <ReviewList reviews={reviews} />
              </div>
              
              <button className="mt-8 w-full py-4 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                Load More Reviews <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {[
                  {
                    q: 'How should I acclimate this fish after delivery?',
                    a: 'Float the bag for 20 to 30 minutes to equalize temperature, then drip acclimate gradually before introducing into your tank.',
                  },
                  {
                    q: 'What tank conditions are recommended?',
                    a: `Maintain stable ${product.waterType.toLowerCase()} parameters, avoid sudden pH/temperature shifts, and provide proper filtration and oxygenation.`,
                  },
                  {
                    q: 'Is this suitable for community tanks?',
                    a: 'Compatibility depends on temperament and size. Match tank mates by behavior, adult size, and water requirements.',
                  },
                  {
                    q: 'What if the fish arrives stressed?',
                    a: 'Keep lights low for the first few hours, reduce handling, and monitor breathing/activity. Contact support promptly if recovery is delayed.',
                  },
                ].map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 open:bg-white open:border-blue-200"
                  >
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-900">{item.q}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="pt-3 text-sm leading-6 text-slate-600">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Products Sidebar */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        {(() => {
          const v = typeof product.vendorId === 'object' && product.vendorId !== null ? product.vendorId : null;
          if (!v) return null;
          const shopHref = v.slug ? `/shop/${v.slug}` : `/shop/${v._id}`;
          const initials = v.name
            .split(' ')
            .map((w: string) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
          return (
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 shadow-sm bg-white">
              <div className="h-20 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 relative">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />
              </div>
              <div className="px-6 pb-6 -mt-8 relative z-10">
                <div className="h-16 w-16 rounded-2xl border-[3px] border-white bg-white shadow-lg overflow-hidden flex items-center justify-center mb-4">
                  {v.logo ? (
                    <img src={v.logo} alt={v.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-sm font-black text-white tracking-wider">{initials}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{v.name}</h3>
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                </div>
                <p className="text-xs text-slate-500 font-medium mb-1">Verified Breeder on Neoblue</p>
                <div className="flex flex-wrap items-center gap-2 mt-3 mb-5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                    <Store className="h-3 w-3" /> Official Store
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                    <Shield className="h-3 w-3" /> Quality Assured
                  </span>
                </div>
                <Link
                  href={shopHref}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg hover:shadow-slate-900/25"
                >
                  <Store className="h-4 w-4" />
                  Visit Storefront
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Link>
              </div>
            </div>
          );
        })()}

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Recommended Products</h3>
            <p className="text-xs text-slate-500 mt-1">Discover other premium aquatic life for your tank setup.</p>
          </div>
          <div className="flex flex-col gap-4">
            {initialRecommendations.length > 0 ? (
              initialRecommendations.map((rec) => (
                <Link
                  href={`/products/${rec._id}`}
                  key={rec._id}
                  className="group flex gap-4 p-3 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all duration-300"
                >
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/50">
                    <img
                      src={rec.images?.[0] || 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'}
                      alt={rec.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {rec.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                        {rec.category} • {rec.waterType}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-black text-sm text-slate-900">{formatPrice(rec.price)}</span>
                      <span className="text-[9px] font-bold text-blue-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recommendations found.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
