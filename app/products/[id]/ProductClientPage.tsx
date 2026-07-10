"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, Truck, Shield, Droplets, Thermometer, Info, MessageSquare, ChevronRight, ChevronDown, Store, CheckCircle2, Search, X, ShieldAlert, Sparkles, Scale, Heart, Package, Leaf, Ruler, User } from 'lucide-react';
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
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('neoblue_wishlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLiked(parsed.includes(productId));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [productId]);

  const toggleLike = () => {
    const saved = localStorage.getItem('neoblue_wishlist');
    let list: string[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          list = parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    const next = list.includes(productId)
      ? list.filter((id) => id !== productId)
      : [...list, productId];
    localStorage.setItem('neoblue_wishlist', JSON.stringify(next));
    setLiked(next.includes(productId));
  };

  const refetchProductStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (data.product) setProduct(data.product);
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
    if (specTemperament === 'Aggressive' && activeMates.length > 0) aggressiveConflict = true;
    activeMates.forEach(mate => {
      const mateTemp = mate.temperament ?? 'Peaceful';
      if (mateTemp === 'Aggressive') aggressiveTankmateConflict = true;
      if (specTemperament === 'Semi-aggressive' && mateTemp === 'Peaceful') warningMates.push(mate.title);
      if (specTemperament === 'Peaceful' && mateTemp === 'Semi-aggressive') warningMates.push(mate.title);
      if (specTemperament === 'Semi-aggressive' && mateTemp === 'Semi-aggressive') semiAggressiveDispute = true;
    });
    let compatibilityRating: 'Green' | 'Orange' | 'Red' = 'Green';
    const alerts: string[] = [];
    if (aggressiveConflict) { compatibilityRating = 'Red'; alerts.push(`Danger: Aggressive ${product.title} cannot be mixed with other tankmates.`); }
    if (aggressiveTankmateConflict) { compatibilityRating = 'Red'; const aggMates = activeMates.filter(m => (m.temperament ?? 'Peaceful') === 'Aggressive').map(m => m.title); alerts.push(`Danger: Incompatible with existing aggressive species in your tank (${aggMates.join(', ')}).`); }
    const phDiff = Math.max(0, specPhMin - tankPh, tankPh - specPhMax);
    const tempDiff = Math.max(0, specTempMin - tankTemp, tankTemp - specTempMax);
    if (phDiff >= 1.5 || tempDiff >= 5) {
      compatibilityRating = 'Red';
      if (phDiff >= 1.5) alerts.push(`Danger: Severe pH mismatch (Diff: ${phDiff.toFixed(1)}). Extremely hazardous.`);
      if (tempDiff >= 5) alerts.push(`Danger: Severe temperature mismatch (Diff: ${tempDiff}°C). Extremely hazardous.`);
    } else {
      if (phMismatch && phDiff < 1.5) { if (compatibilityRating !== 'Red') compatibilityRating = 'Orange'; alerts.push(`Warning: pH ${tankPh.toFixed(1)} is outside the ideal range (${specPhMin} - ${specPhMax}).`); }
      if (tempMismatch && tempDiff < 5) { if (compatibilityRating !== 'Red') compatibilityRating = 'Orange'; alerts.push(`Warning: Temperature ${tankTemp}°C is outside the ideal range (${specTempMin}°C - ${specTempMax}°C).`); }
    }
    if (warningMates.length > 0) { if (compatibilityRating !== 'Red') compatibilityRating = 'Orange'; alerts.push(specTemperament === 'Semi-aggressive' ? `Caution: Semi-aggressive ${product.title} may harass peaceful tankmates (${warningMates.join(', ')}).` : `Caution: Peaceful ${product.title} may be harassed by semi-aggressive tankmates (${warningMates.join(', ')}).`); }
    if (semiAggressiveDispute) { if (compatibilityRating !== 'Red') compatibilityRating = 'Orange'; alerts.push(`Caution: Multiple semi-aggressive species can trigger territorial disputes. Monitor closely.`); }
    if (compatibilityRating === 'Green' && alerts.length === 0) alerts.push(`Specimen is fully compatible with your current tank parameters and species selection.`);
    return { rating: compatibilityRating, alerts, activeMates };
  }, [product, tankPh, tankTemp, selectedMates, allProducts]);

  const productImages = product.images && product.images.length > 0
    ? product.images
    : ['https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'];
  const productVideos = Array.isArray(product.videos) ? product.videos : [];

  const mediaItems = [
    ...productImages.map((url) => ({ type: 'image' as const, url })),
    ...productVideos.map((url) => ({ type: 'video' as const, url })),
  ];
  const activeMedia = mediaItems[Math.min(activeImageIndex, mediaItems.length - 1)] || mediaItems[0];

  const vendor = typeof product.vendorId === 'object' && product.vendorId !== null ? product.vendorId : null;
  const shopHref = vendor ? (vendor.slug ? `/shop/${vendor.slug}` : `/shop/${vendor._id}`) : '#';

  return (
    <>
      {/* ─────── ROW 1: IMAGE + PRODUCT INFO ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">

        {/* ── Image Gallery ── */}
        <div className="space-y-3">
          <div className="relative aspect-square w-full rounded-2xl lg:rounded-3xl bg-slate-950 overflow-hidden group">
            {activeMedia.type === 'video' ? (
              <video
                src={activeMedia.url}
                className="absolute inset-0 h-full w-full object-cover"
                controls
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={activeMedia.url}
                alt={`${product.title} - NeoBlue`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            )}
            {/* gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

            {/* badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.tag && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-white/90 backdrop-blur-sm text-slate-900 shadow-lg border border-white/20">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" /> {product.tag}
                </span>
              )}
              {!product.inStock && (
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-rose-500 text-white shadow-lg">
                  Sold Out
                </span>
              )}
            </div>

            {/* floating actions */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button
                onClick={toggleLike}
                className={`h-10 w-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                  liked ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-600 hover:text-rose-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* bottom status bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[11px] font-semibold text-white/90">Live Arrival Guaranteed</span>
              </div>
              {mediaItems.length > 1 && (
                <span className="bg-black/50 backdrop-blur-md text-white/80 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/10">
                  {activeImageIndex + 1}/{mediaItems.length}
                </span>
              )}
            </div>
          </div>

          {/* thumbnails */}
          {mediaItems.length > 1 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {mediaItems.map((item, i) => (
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  key={`thumb-${i}`}
                  className={`relative shrink-0 w-16 h-16 md:w-[72px] md:h-[72px] rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-200 ${
                    i === activeImageIndex
                      ? 'border-blue-600 shadow-md shadow-blue-600/20'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {item.type === 'video' ? (
                    <>
                      <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <img src={item.url} alt={`${product.title} view ${i + 1}`} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info + Price + Cart ── */}
        <div className="flex flex-col lg:sticky lg:top-24 self-start space-y-5">

          {/* Category crumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href={`/products?category=${product.category}`} className="hover:text-blue-600 transition-colors">{product.category}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">{product.waterType}</span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-[1.15]">{product.title}</h1>
            {product.scientific && (
              <p className="text-base text-slate-400 italic mt-1.5 font-serif">{product.scientific}</p>
            )}
          </div>

          {/* Rating + Reviews count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-500">{product.rating.toFixed(1)}</span>
            <button onClick={() => setActiveTab('reviews')} className="text-sm text-blue-600 font-semibold hover:underline cursor-pointer">
              {reviews.length} review{reviews.length !== 1 && 's'}
            </button>
          </div>

          {/* Vendor badge */}
          {vendor && (
            <Link
              href={shopHref}
              className="inline-flex items-center gap-2 w-fit text-sm text-slate-600 hover:text-blue-600 transition-colors group"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden border border-blue-200 shrink-0">
                {vendor.logo ? (
                  <img src={vendor.logo} alt={vendor.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[9px] font-black text-white">{vendor.name.charAt(0)}</span>
                )}
              </div>
              <span className="font-semibold group-hover:text-blue-600">{vendor.name}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
            </Link>
          )}

          {/* ── Price Block ── */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">{formatPrice(product.price)}</span>
              {typeof product.perPairPrice === 'number' ? (
                <span className="text-sm text-slate-400 font-medium">per pair</span>
              ) : typeof product.perPiecePrice === 'number' ? (
                <span className="text-sm text-slate-400 font-medium">per piece</span>
              ) : null}
            </div>

            {(product.size || product.ageCategory) && (
              <div className="flex flex-wrap gap-2.5 pt-3 border-t border-slate-100">
                {product.size && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
                    📐 Size: {product.size}
                  </span>
                )}
                {product.ageCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-50 border border-pink-100 text-xs font-bold text-pink-700 capitalize">
                    🐟 Age: {product.ageCategory}
                  </span>
                )}
              </div>
            )}

            {/* Quantity & Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors font-medium text-lg"
                >−</button>
                <span className="w-10 h-10 flex items-center justify-center font-bold text-sm text-slate-900 border-x border-slate-200">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors font-medium text-lg"
                >+</button>
              </div>

              <button
                onClick={() => { for (let i = 0; i < quantity; i++) product && addToCart(product); }}
                disabled={!product.inStock}
                className={`flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                  ${product.inStock
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-600/20 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                <ShoppingBag className="h-4 w-4" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>

          {/* Trust strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'Express Shipping', sub: 'Temperature-controlled', color: 'text-blue-600 bg-blue-50' },
              { icon: Shield, label: 'Live Guarantee', sub: '100% DOA covered', color: 'text-emerald-600 bg-emerald-50' },
              { icon: Package, label: 'Quarantined', sub: 'Health-certified', color: 'text-violet-600 bg-violet-50' },
            ].map((badge, i) => (
              <div key={i} className="text-center p-3 rounded-xl border border-slate-100 bg-white">
                <div className={`w-9 h-9 rounded-lg ${badge.color} flex items-center justify-center mx-auto mb-1.5`}>
                  <badge.icon className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">{badge.label}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{badge.sub}</p>
              </div>
            ))}
          </div>

          {/* Short description */}
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
            {product.description || 'Premium aquatic specimen, quarantine-tested and ready for your tank setup.'}
          </p>
        </div>
      </div>

      {/* ─────── ROW 2: TABS + SIDEBAR ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 mt-10">

        {/* ── Main Tabs ── */}
        <div className="lg:col-span-2 space-y-0">

          {/* Tab bar */}
          <div className="flex overflow-x-auto hide-scrollbar -mb-px">
            {[
              { id: 'description', icon: Info, label: 'Overview' },
              { id: 'specifications', icon: Thermometer, label: 'Care & Specs' },
              { id: 'policies', icon: Shield, label: 'Shipping & Guarantees' },
              { id: 'faq', icon: MessageSquare, label: 'FAQ' },
              { id: 'reviews', icon: Star, label: `Reviews (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-b-2xl rounded-t-none border border-t-0 border-slate-200/80 p-6 md:p-8 min-h-[280px]">

            {activeTab === 'description' && (
              <div className="max-w-3xl space-y-6">
                <h3 className="text-xl font-bold text-slate-900">About this {product.title}</h3>
                <div className="prose prose-slate prose-sm max-w-none">
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Why NeoBlue?</h4>
                  <ul className="space-y-3">
                    {[
                      "All livestock undergoes a strict quarantine period before sale.",
                      "We ensure optimal water parameters and nutrition.",
                      "Expert advice available post-purchase to ensure a healthy transition.",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Shield className="h-3 w-3 text-emerald-600" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Care Requirements & Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { title: "Common Name", value: product.title, icon: Sparkles, color: "text-blue-600 bg-blue-50" },
                    { title: "Scientific Name", value: product.scientific || 'N/A', icon: Leaf, color: "text-emerald-600 bg-emerald-50" },
                    { title: "Water Type", value: product.waterType, icon: Droplets, color: "text-cyan-600 bg-cyan-50" },
                    { title: "pH Range", value: `${product.phMin ?? '6.0'} – ${product.phMax ?? '8.0'}`, icon: Droplets, color: "text-teal-600 bg-teal-50" },
                    { title: "Temperature", value: `${product.tempMin ?? '20'}°C – ${product.tempMax ?? '30'}°C`, icon: Thermometer, color: "text-rose-600 bg-rose-50" },
                    { title: "Temperament", value: product.temperament || 'Peaceful', icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
                    { title: "Category", value: product.category, icon: Store, color: "text-purple-600 bg-purple-50" },
                    ...(product.subcategory ? [{ title: "Subcategory", value: product.subcategory, icon: Store, color: "text-purple-600 bg-purple-50" }] : []),
                    ...(product.size ? [{ title: "Size", value: product.size, icon: Ruler, color: "text-indigo-600 bg-indigo-50" }] : []),
                    ...(product.ageCategory ? [{ title: "Age Category", value: product.ageCategory, icon: User, color: "text-pink-600 bg-pink-50" }] : []),
                    { title: "Weight/Piece", value: `${product.weightPerPiece || 250} gm`, icon: Scale, color: "text-slate-600 bg-slate-100" },
                    { title: "Stock", value: product.inStock ? 'In Stock' : 'Out of Stock', icon: CheckCircle2, color: product.inStock ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50" },
                  ].map((spec, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
                      <div className={`w-9 h-9 rounded-lg ${spec.color} flex items-center justify-center shrink-0`}>
                        <spec.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium">{spec.title}</p>
                        <p className="text-xs font-bold text-slate-800 truncate">{spec.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="max-w-3xl space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Shipping & Guarantees</h3>
                <div className="space-y-5">
                  {[
                    { icon: Shield, color: 'text-emerald-600 bg-emerald-50', title: '100% Live Arrival Guarantee', desc: 'All live specimens arrive healthy. DOA claims require a photo and video of the unopened bag within 2 hours of delivery for a full credit or replacement.' },
                    { icon: Info, color: 'text-blue-600 bg-blue-50', title: 'Return & Replacement Policy', desc: 'Due to biosecurity standards, physical returns of live fish, plants, or invertebrates cannot be accepted. Contact support for post-acclimation advice.' },
                    { icon: Truck, color: 'text-indigo-600 bg-indigo-50', title: 'Thermo-Insulated Packaging', desc: 'Specimens are packed in double-layered oxygenated bags inside styrofoam boxes with seasonal heat/cold packs. Shipped via express next-day air couriers.' },
                  ].map((policy, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl ${policy.color} flex items-center justify-center shrink-0`}>
                        <policy.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{policy.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed mt-1">{policy.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl">
                      <span className="text-2xl font-black text-slate-900">{product.rating.toFixed(1)}</span>
                      <div className="flex mt-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-2.5 w-2.5 ${s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Customer Reviews</h3>
                      <p className="text-sm text-slate-500">{reviews.length} verified purchase{reviews.length !== 1 && 's'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowForm(s => !s)}
                    className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800 transition-colors cursor-pointer active:scale-[0.97]"
                  >
                    {showForm ? 'Cancel' : 'Write a Review'}
                  </button>
                </div>

                {showForm && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <ReviewForm productId={productId} onSubmit={() => { refetchReviews(); refetchProductStats(); setShowForm(false); }} />
                  </div>
                )}

                <ReviewList reviews={reviews} />
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-3 max-w-3xl">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
                {(product.faq && product.faq.length > 0
                  ? product.faq
                  : [
                      { q: 'How should I acclimate this fish after delivery?', a: 'Float the bag for 20-30 minutes to equalize temperature, then drip acclimate gradually before introducing into your tank.' },
                      { q: 'What tank conditions are recommended?', a: `Maintain stable ${product.waterType.toLowerCase()} parameters, avoid sudden pH/temperature shifts, and provide proper filtration and oxygenation.` },
                      { q: 'Is this suitable for community tanks?', a: 'Compatibility depends on temperament and size. Match tank mates by behavior, adult size, and water requirements.' },
                      { q: 'What if the fish arrives stressed?', a: 'Keep lights low for the first few hours, reduce handling, and monitor breathing/activity. Contact support promptly if recovery is delayed.' },
                    ]
                ).map((item: any, i: number) => (
                  <details key={i} className="group rounded-xl border border-slate-200 px-5 py-4 open:bg-slate-50 transition-all">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                      <span className="font-semibold text-sm text-slate-800">{item.q}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="pt-3 text-sm text-slate-500 leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">

          {/* Compatibility Checker */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl" />
            </div>

            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-blue-400" />
                  Compatibility Checker
                </h3>
                <p className="text-xs text-slate-400 mt-1">Match your tank parameters to check safety.</p>
              </div>

              {/* pH */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-300">Tank pH</span>
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-md">
                    {tankPh.toFixed(1)}
                  </span>
                </div>
                <input type="range" min="5.0" max="9.0" step="0.1" value={tankPh}
                  onChange={(e) => setTankPh(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-[11px] text-slate-500">Ideal: {(product.phMin ?? 6.0).toFixed(1)} – {(product.phMax ?? 8.0).toFixed(1)}</p>
              </div>

              {/* Temp */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-300">Temperature</span>
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-md">
                    {tankTemp}°C
                  </span>
                </div>
                <input type="range" min="15" max="35" step="1" value={tankTemp}
                  onChange={(e) => setTankTemp(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-[11px] text-slate-500">Ideal: {product.tempMin ?? 20}°C – {product.tempMax ?? 30}°C</p>
              </div>

              {/* Tankmates */}
              <div className="space-y-2 relative">
                <span className="text-xs font-medium text-slate-300">Tank Inhabitants</span>
                {compatibilityData.activeMates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {compatibilityData.activeMates.map(mate => (
                      <span key={mate._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                        {mate.title}
                        <button type="button" onClick={() => setSelectedMates(prev => prev.filter(id => id !== mate._id))} className="text-slate-500 hover:text-white cursor-pointer">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 border border-slate-700 rounded-lg px-3 h-9 bg-slate-800/50 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text" placeholder="Add species..."
                    value={mateSearchQuery}
                    onChange={(e) => { setMateSearchQuery(e.target.value); setShowMatesDropdown(true); }}
                    onFocus={() => setShowMatesDropdown(true)}
                    className="w-full h-full border-none outline-none bg-transparent text-xs text-white placeholder:text-slate-500"
                  />
                </div>
                {showMatesDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 z-20 mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
                    {searchResults.slice(0, 8).map((p) => (
                      <button key={p._id} type="button" onClick={() => { setSelectedMates(prev => [...prev, p._id]); setMateSearchQuery(''); setShowMatesDropdown(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer text-slate-300"
                      >
                        <div>
                          <span className="font-medium">{p.title}</span>
                          <span className="text-[10px] text-slate-500 block">{p.scientific || p.category}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                          {p.temperament || 'Peaceful'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {showMatesDropdown && (<div className="fixed inset-0 z-10" onClick={() => setShowMatesDropdown(false)} />)}
              </div>

              {/* Verdict */}
              <div className={`p-3.5 rounded-xl border ${
                compatibilityData.rating === 'Green' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' :
                compatibilityData.rating === 'Orange' ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' :
                'bg-rose-500/10 border-rose-500/25 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {compatibilityData.rating === 'Green' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                   compatibilityData.rating === 'Orange' ? <Info className="w-4 h-4 text-amber-400" /> :
                   <ShieldAlert className="w-4 h-4 text-rose-400" />}
                  <span className="text-xs font-bold">
                    {compatibilityData.rating === 'Green' ? 'Compatible Setup' :
                     compatibilityData.rating === 'Orange' ? 'Proceed with Caution' : 'Incompatible'}
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] font-medium leading-relaxed">
                  {compatibilityData.alerts.map((alert, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0 opacity-60" />
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Breeder card */}
          {vendor && (() => {
            const initials = vendor.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="h-16 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 relative">
                  <div className="absolute -bottom-5 left-5">
                    <div className="h-10 w-10 rounded-xl border-2 border-white bg-white overflow-hidden shadow-sm">
                      {vendor.logo ? (
                        <img src={vendor.logo} alt={vendor.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                          <span className="text-[10px] font-black text-white">{initials}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-7 px-5 pb-4 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900">{vendor.name}</h4>
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Verified Breeder</span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Quality Assured</span>
                  </div>
                  <Link href={shopHref} className="flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors">
                    <Store className="h-3.5 w-3.5" /> Visit Storefront
                  </Link>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Related Products Section at the Bottom */}
      {initialRecommendations.length > 0 && (
        <div className="mt-12 pt-10 border-t border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">You may also like</h3>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Recommended Products</span>
          </div>
          <div className="flex flex-col gap-3.5 max-w-3xl">
            {initialRecommendations.map(rec => (
              <Link 
                key={rec._id} 
                href={`/products/${rec._id}`} 
                className="group flex gap-4 p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-350"
              >
                <div className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
                  <img
                    src={rec.images?.[0] || 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'}
                    alt={rec.title} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {rec.category}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {rec.waterType}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 truncate group-hover:text-blue-600 transition-colors">{rec.title}</h4>
                  {rec.scientific && <p className="text-xs text-slate-400 italic font-serif truncate mt-0.5">{rec.scientific}</p>}
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-sm font-black text-slate-900">{formatPrice(rec.price)}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      /{rec.perPairPrice != null && typeof rec.perPairPrice === 'number' ? 'Pair' : 'Piece'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
