"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, Truck, Shield, Droplets, Thermometer, Info, MessageSquare, ChevronRight, Heart, Share2, Store, CheckCircle2, Search, X, ShieldAlert, Sparkles, Scale, HeartHandshake } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'policies' | 'faq' | 'reviews'>('description');
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      
      {/* LEFT COLUMN: Gallery & Main tabs */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Gallery Panel */}
        <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="relative aspect-[4/3] w-full rounded-2xl bg-slate-950 overflow-hidden group shadow-inner">
            <img
              src={activeImage}
              alt={`${product.title} - Care Requirements & Specifications`}
              className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            
            {/* Live Indicator overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.tag && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg">
                  <Sparkles className="h-3 w-3" /> {product.tag}
                </span>
              )}
              {!product.inStock && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white shadow-lg">
                  Out of Stock
                </span>
              )}
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Arrival Protected</span>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {productImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pt-4">
              {productImages.map((image, i) => (
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  key={`${image}-${i}`}
                  className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl bg-slate-50 border cursor-pointer overflow-hidden transition-all duration-300 ${
                    i === activeImageIndex 
                      ? 'border-blue-500 ring-4 ring-blue-500/10 scale-95 shadow-sm' 
                      : 'border-slate-200/60 hover:border-blue-300'
                  }`}
                >
                  <img src={image} alt={`${product.title} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Selection */}
        <div className="space-y-6">
          <div className="flex overflow-x-auto hide-scrollbar gap-1 border-b border-slate-100 pb-px">
            {[
              { id: 'description', icon: Info, label: 'Overview' },
              { id: 'specifications', icon: Thermometer, label: 'Care Guidelines' },
              { id: 'policies', icon: Shield, label: 'Guarantees & Returns' },
              { id: 'faq', icon: MessageSquare, label: 'FAQs' },
              { id: 'reviews', icon: Star, label: `Reviews (${reviews.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap uppercase tracking-wider
                  ${activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600 font-extrabold' 
                    : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'}`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Screen Content */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xs min-h-[300px]">
            
            {activeTab === 'description' && (
              <div className="max-w-3xl animate-fadeIn space-y-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Product Overview</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">{product.description}</p>
                
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">The NeoBlue Standard</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Strict 14-day quarantine & pathogen screening.",
                      "Custom nutrition programs for vibrant colors.",
                      "Bespoke oxygenated thermo-insulated packing.",
                      "Post-purchase veterinary/husbandry assistance."
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="animate-fadeIn space-y-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Care Requirements & Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(() => {
                    const specs = [
                      { title: "Common Name", value: product.title, icon: Sparkles, color: "text-blue-600 bg-blue-50" },
                      { title: "Scientific Name", value: product.scientific || 'N/A', icon: Info, color: "text-indigo-600 bg-indigo-50" },
                      { title: "Water Type", value: product.waterType, icon: Droplets, color: "text-cyan-600 bg-cyan-50" },
                      { title: "pH Range", value: `${product.phMin ?? '6.0'} - ${product.phMax ?? '8.0'} pH`, icon: Droplets, color: "text-teal-600 bg-teal-50" },
                      { title: "Temperature", value: `${product.tempMin ?? '20'}°C - ${product.tempMax ?? '30'}°C`, icon: Thermometer, color: "text-rose-600 bg-rose-50" },
                      { title: "Temperament", value: product.temperament || 'Peaceful', icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
                      { title: "Category", value: product.category, icon: Store, color: "text-purple-600 bg-purple-50" },
                      ...(product.subcategory ? [{ title: "Subcategory", value: product.subcategory, icon: Store, color: "text-purple-600 bg-purple-50" }] : []),
                      { title: "Weight Per Piece", value: `${product.weightPerPiece || '250'} gm`, icon: Scale, color: "text-slate-600 bg-slate-100" },
                    ];

                    return specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xs transition-all duration-300">
                        <div className={`w-10 h-10 rounded-xl ${spec.color} flex items-center justify-center shrink-0`}>
                          <spec.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{spec.title}</p>
                          <p className="text-xs font-black text-slate-800 uppercase mt-0.5">{spec.value}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="max-w-3xl animate-fadeIn space-y-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Shipping Policies & Exclusions</h3>
                
                <div className="divide-y divide-slate-100">
                  <div className="py-4 first:pt-0 flex gap-4 items-start">
                    <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">100% Live Arrival Guarantee</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1">
                        We guarantee that all live specimens will arrive healthy. In the rare event of Dead-on-Arrival (DOA), please send a clear photo and video of the unopened bag within 2 hours of delivery for a full credit/replacement.
                      </p>
                    </div>
                  </div>

                  <div className="py-4 flex gap-4 items-start">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Biological Return Policies</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1">
                        Due to health protocols and biosecurity regulations, we cannot accept physical returns of live species. Please contact support for transition guidelines.
                      </p>
                    </div>
                  </div>

                  <div className="py-4 last:pb-0 flex gap-4 items-start">
                    <Truck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Specialized Thermos Insulated Boxes</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1">
                        Specimens are packed with pure oxygen in thick double bags, protected in styrofoam containers with heat/gel packs to counter local weather shifts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="animate-fadeIn space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-2xl font-black text-slate-900">{product.rating.toFixed(1)}</span>
                      <div className="flex text-amber-400 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-2.5 w-2.5 ${star <= Math.round(product.rating) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Certified Buyer Reviews</h4>
                      <p className="text-xs text-slate-500 font-medium">Based on {reviews.length} purchase(s)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="h-10 px-5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {showForm ? 'Close' : 'Write a Review'}
                  </button>
                </div>

                {showForm && (
                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <ReviewForm productId={productId} onSubmit={() => {
                      refetchReviews();
                      refetchProductStats();
                      setShowForm(false);
                    }} />
                  </div>
                )}

                <ReviewList reviews={reviews} />
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="animate-fadeIn space-y-3">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">Frequently Asked Questions</h3>
                {[
                  {
                    q: 'How should I acclimate this specimen after delivery?',
                    a: 'Float the bag for 20-30 minutes to equalize temperature, then drip-acclimate gradually to match pH before transferring it to your tank.',
                  },
                  {
                    q: 'What tank parameters are recommended?',
                    a: `Ensure you maintain a stable ${product.waterType.toLowerCase()} setup, avoid spikes in ammonia/nitrites, and keep parameters in ideal ranges.`,
                  },
                  {
                    q: 'What if the fish arrives stressed?',
                    a: 'Keep the tank lights off for 3-4 hours post-release, minimize noise, and monitor breathing closely. Reach out immediately if stress persists.',
                  },
                ].map((item, idx) => (
                  <details
                    key={idx}
                    className="group rounded-2xl border border-slate-200/70 bg-slate-50/50 px-4 py-3.5 open:bg-white open:border-blue-200 transition-all duration-300"
                  >
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-bold text-xs uppercase tracking-wider text-slate-700">
                      <span>{item.q}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="pt-3 text-xs leading-relaxed text-slate-500 font-semibold">{item.a}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Buying card, Storefront & Compatibility widget */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Info & Cart Panel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{product.category} • {product.waterType}</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mt-1">{product.title}</h1>
            <p className="text-xs text-slate-400 italic font-medium mt-0.5">{product.scientific ?? 'Aquatic specimen'}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Premium Price</p>
              <p className="text-3xl font-black text-slate-950 mt-0.5">{formatPrice(product.price)}</p>
            </div>
            {product.originalPrice && (
              <div className="text-right">
                <p className="text-xs text-slate-400 line-through">{formatPrice(product.originalPrice)}</p>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                  Save {product.discountPercentage || 20}%
                </span>
              </div>
            )}
          </div>

          {/* Pricing unit notes */}
          <p className="text-xs text-slate-500 font-semibold bg-blue-50/40 border border-blue-100/30 p-3 rounded-xl flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            {typeof product.perPairPrice === 'number' ? (
              <span>Listed unit price is per <strong>Pair</strong> (2 pieces).</span>
            ) : (
              <span>Listed unit price is per <strong>Piece</strong> (1 piece).</span>
            )}
          </p>

          {/* Quantity selector & Add to cart button */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-200 shrink-0">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-xs font-bold"
                >-</button>
                <span className="w-9 text-center font-black text-xs text-slate-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-xs font-bold"
                >+</button>
              </div>

              <button
                onClick={() => {
                  for (let i = 0; i < quantity; i++) product && addToCart(product);
                }}
                disabled={!product.inStock}
                className={`flex-1 h-11 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md
                  ${product.inStock 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-600/25 active:scale-95 cursor-pointer' 
                    : 'bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200'}`}
              >
                <ShoppingBag className="h-4 w-4" /> 
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>

        {/* COMPATIBILITY CALCULATOR */}
        <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 text-white space-y-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-blue-400 shrink-0" />
              <h3 className="text-base font-black uppercase tracking-widest text-slate-200">Compatibility Checker</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              Adjust parameters below to match your home aquarium setup and check safety warnings.
            </p>

            {/* pH Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Aquarium pH</span>
                <span className="font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  {tankPh.toFixed(1)} pH
                </span>
              </div>
              <input
                type="range"
                min="5.0"
                max="9.0"
                step="0.1"
                value={tankPh}
                onChange={(e) => setTankPh(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 outline-none"
              />
              <p className="text-[9px] text-slate-400 font-semibold flex items-center justify-between">
                <span>Specimen ideal:</span>
                <span className="font-bold text-slate-300">{(product.phMin ?? 6.0).toFixed(1)} - {(product.phMax ?? 8.0).toFixed(1)} pH</span>
              </p>
            </div>

            {/* Temp Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Temperature</span>
                <span className="font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  {tankTemp}°C
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="35"
                step="1"
                value={tankTemp}
                onChange={(e) => setTankTemp(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 outline-none"
              />
              <p className="text-[9px] text-slate-400 font-semibold flex items-center justify-between">
                <span>Specimen ideal:</span>
                <span className="font-bold text-slate-300">{product.tempMin ?? 20}°C - {product.tempMax ?? 30}°C</span>
              </p>
            </div>

            {/* Inhabitants search */}
            <div className="space-y-2 pt-2 relative">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Aquarium Inhabitants</label>
              
              {compatibilityData.activeMates.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {compatibilityData.activeMates.map(mate => (
                    <span key={mate._id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
                      {mate.title}
                      <button
                        type="button"
                        onClick={() => setSelectedMates(prev => prev.filter(id => id !== mate._id))}
                        className="w-3.5 h-3.5 rounded hover:bg-slate-700 flex items-center justify-center text-slate-400 cursor-pointer"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 border border-slate-800 rounded-xl px-3 h-10 bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search and add species..."
                  value={mateSearchQuery}
                  onChange={(e) => {
                    setMateSearchQuery(e.target.value);
                    setShowMatesDropdown(true);
                  }}
                  onFocus={() => setShowMatesDropdown(true)}
                  className="w-full h-full border-none outline-none bg-transparent text-xs text-white"
                />
              </div>

              {showMatesDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
                  {searchResults.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setSelectedMates(prev => [...prev, p._id]);
                        setMateSearchQuery('');
                        setShowMatesDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between cursor-pointer text-slate-300"
                    >
                      <div>
                        <span>{p.title}</span>
                        <span className="text-[9px] text-slate-500 block">{p.scientific || p.category}</span>
                      </div>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 uppercase font-black tracking-wider">
                        {p.temperament || 'Peaceful'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Checker Report Panel */}
            <div className={`p-4 rounded-2xl border transition-all ${
              compatibilityData.rating === 'Green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
              compatibilityData.rating === 'Orange' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
              'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {compatibilityData.rating === 'Green' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : compatibilityData.rating === 'Orange' ? (
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Verdict:{' '}
                  <span className={`font-black ${
                    compatibilityData.rating === 'Green' ? 'text-emerald-400' :
                    compatibilityData.rating === 'Orange' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {compatibilityData.rating === 'Green' ? 'Compatible' :
                     compatibilityData.rating === 'Orange' ? 'Caution' : 'Incompatible'}
                  </span>
                </span>
              </div>

              <ul className="space-y-1 text-[10px] pl-0.5 font-medium leading-relaxed">
                {compatibilityData.alerts.map((alert, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="mt-1 w-1 h-1 rounded-full shrink-0 bg-current opacity-60" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Breeder Profile Widget */}
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
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 shadow-xs bg-white p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                  {v.logo ? (
                    <img src={v.logo} alt={v.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-xs font-black text-white">{initials}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{v.name}</h4>
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified Breeder</p>
                </div>
              </div>

              <div className="flex items-center gap-2 py-0.5">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold border border-blue-100/50 uppercase tracking-wider">
                  Official Store
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100/50 uppercase tracking-wider">
                  Quality Checked
                </span>
              </div>

              <Link
                href={shopHref}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xs"
              >
                Visit Storefront <ChevronRight className="h-3.5 w-3.5 ml-auto" />
              </Link>
            </div>
          );
        })()}

        {/* Recommended Products Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recommendations</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Other premium specimens in stock.</p>
          </div>
          
          <div className="flex flex-col gap-3">
            {initialRecommendations.length > 0 ? (
              initialRecommendations.map((rec) => (
                <Link
                  href={`/products/${rec._id}`}
                  key={rec._id}
                  className="group flex gap-3 p-2 rounded-2xl border border-slate-50 hover:border-blue-200 hover:bg-blue-50/5 transition-all duration-300"
                >
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
                    <img
                      src={rec.images?.[0] || 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'}
                      alt={rec.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {rec.title}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {rec.category} • {rec.waterType}
                    </p>
                    <p className="font-black text-xs text-slate-950 mt-1">{formatPrice(rec.price)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-[10px] text-slate-400 py-3 text-center">No matches found.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
