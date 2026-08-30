"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, Truck, Shield, Droplets, Thermometer, Info, MessageSquare, ChevronRight, ChevronLeft, ChevronDown, Store, CheckCircle2, Search, X, ShieldAlert, Sparkles, Scale, Heart, Package, Leaf, Ruler, User, Activity, Box, Home, Fish, Beaker, Sun, Wind, Smile, Bell, Check } from 'lucide-react';
import ReviewList from '@/app/components/ReviewList';
import ReviewForm from '@/app/components/ReviewForm';
import ReviewStars from '@/app/components/ReviewStars';
import ProductCard from '@/app/components/ProductCard';
import FrequentlyBoughtTogether from '@/app/components/FrequentlyBoughtTogether';
import StockAlertModal from '@/app/components/StockAlertModal';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { trackViewContent } from '@/lib/fpixel';

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
  const [selectedPackQty, setSelectedPackQty] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const liked = isInWishlist(productId);
  const [tankPh, setTankPh] = useState(7.0);
  const [tankTemp, setTankTemp] = useState(24);
  const [selectedMates, setSelectedMates] = useState<string[]>([]);
  const [mateSearchQuery, setMateSearchQuery] = useState('');
  const [showMatesDropdown, setShowMatesDropdown] = useState(false);
  const recScrollRef = useRef<HTMLDivElement>(null);

  // Volume discount calculation (5% on 3-pack, 10% on 6-pack, 0% on 1-pack and 10-pack)
  const currentDiscount = selectedPackQty === 6 ? 0.10 : selectedPackQty === 3 ? 0.05 : 0;
  const packUnitPrice = Math.round(product.price * selectedPackQty * (1 - currentDiscount));
  const calculatedTotalPrice = packUnitPrice * quantity;

  const handleAddToCart = () => {
    if (!product || !product.inStock) return;
    const packLabel = selectedPackQty > 1 ? `Pack of ${selectedPackQty}` : (product.perPairPrice != null ? 'pair' : 'piece');
    addToCart(product, quantity, true, {
      packQty: selectedPackQty,
      unitLabel: packLabel,
      customPrice: packUnitPrice,
      customOriginalPrice: product.price * selectedPackQty,
    });
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 2200);
  };

  useEffect(() => {
    if (product) {
      trackViewContent({
        id: product._id,
        name: product.title,
        category: product.category,
        price: product.price,
        currency: 'INR',
      });
    }
  }, [product]);

  const isPlants = product.category === 'Plants';
  const theme = isPlants ? {
    text: 'text-emerald-600',
    hoverText: 'hover:text-emerald-600',
    groupHoverText: 'group-hover:text-emerald-600',
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-600',
    icon: 'text-emerald-500',
    btn: 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer',
    thumbActive: 'border-emerald-600 shadow-md shadow-emerald-600/20',
  } : {
    text: 'text-blue-600',
    hoverText: 'hover:text-blue-600',
    groupHoverText: 'group-hover:text-blue-600',
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-50',
    border: 'border-blue-600',
    icon: 'text-blue-500',
    btn: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-600/20 cursor-pointer',
    thumbActive: 'border-blue-600 shadow-md shadow-blue-600/20',
  };

  const specBadgeStyle = isPlants
    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
    : product.waterType === 'Saltwater'
    ? 'bg-cyan-50 border-cyan-100 text-cyan-700'
    : product.waterType === 'Brackish'
    ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
    : 'bg-blue-50 border-blue-100 text-blue-700';

  const toggleLike = () => {
    toggleWishlist(productId);
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
                alt={`${product.title} ${product.scientific ? `(${product.scientific})` : ''} - Premium ${product.category} for sale online at NeoBlue`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            )}
            {/* gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

            {/* badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.tag && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-white/90 backdrop-blur-sm text-slate-900 shadow-lg border border-white/20">
                  <Sparkles className={`h-3.5 w-3.5 ${theme.text}`} /> {product.tag}
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
                      ? theme.thumbActive
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
            <Link href={`/products?category=${product.category}`} className={`${theme.hoverText} transition-colors`}>{product.category}</Link>
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
            <button onClick={() => setActiveTab('reviews')} className={`text-sm ${theme.text} font-semibold hover:underline cursor-pointer`}>
              {reviews.length} review{reviews.length !== 1 && 's'}
            </button>
          </div>



          {/* ── Price Block ── */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-black text-slate-900">
                ₹{packUnitPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-slate-500 font-semibold">
                {selectedPackQty > 1 
                  ? `(Pack of ${selectedPackQty})` 
                  : (typeof product.perPairPrice === 'number' ? 'per pair' : 'per piece')}
              </span>
              {selectedPackQty > 1 && currentDiscount > 0 && (
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Save {Math.round(currentDiscount * 100)}%
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Quick Specs</h4>
              <div className="flex flex-wrap gap-2.5">
                {product.size && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${specBadgeStyle}`}>
                    <Ruler className="h-3.5 w-3.5" /> Size: {product.size}
                  </span>
                )}
                {product.ageCategory && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold capitalize ${specBadgeStyle}`}>
                    <Fish className="h-3.5 w-3.5" /> Age: {product.ageCategory}
                  </span>
                )}
                {product.waterType && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${specBadgeStyle}`}>
                    <Droplets className="h-3.5 w-3.5" /> {product.waterType}
                  </span>
                )}
                {product.phMin && product.phMax && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${specBadgeStyle}`}>
                    <Beaker className="h-3.5 w-3.5" /> pH {product.phMin}-{product.phMax}
                  </span>
                )}
                {product.tempMin && product.tempMax && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${specBadgeStyle}`}>
                    <Thermometer className="h-3.5 w-3.5" /> {product.tempMin}-{product.tempMax}°C
                  </span>
                )}
                {product.category === 'Plants' ? (
                  <>
                    {product.lightingRequirement && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${specBadgeStyle}`}>
                        <Sun className="h-3.5 w-3.5" /> {product.lightingRequirement} Light
                      </span>
                    )}
                    {product.co2Requirement && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${specBadgeStyle}`}>
                        <Wind className="h-3.5 w-3.5" /> {product.co2Requirement} CO2
                      </span>
                    )}
                  </>
                ) : (
                  product.temperament && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${specBadgeStyle}`}>
                      <Smile className="h-3.5 w-3.5" /> {product.temperament}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* ── Volume Quantity Packs (Schooling / Aquascaper Bundles) ── */}
            {product.inStock && (
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-blue-600" />
                    <span>Schooling &amp; Volume Packs</span>
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Up to 10% OFF
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { qty: 1, label: '1 Piece', discount: 0, badge: 'Standard' },
                    { qty: 3, label: 'Pack of 3', discount: 5, badge: '5% OFF' },
                    { qty: 6, label: 'Pack of 6', discount: 10, badge: '10% OFF 🔥' },
                    { qty: 10, label: 'Pack of 10', discount: 0, badge: 'Pack of 10' },
                  ].map((pack) => {
                    const isSelected = selectedPackQty === pack.qty;
                    const discountedTotal = Math.round(product.price * pack.qty * (1 - pack.discount / 100));

                    return (
                      <button
                        key={pack.qty}
                        type="button"
                        onClick={() => setSelectedPackQty(pack.qty)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? (isPlants ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-xs' : 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-xs')
                            : 'border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/70'
                        }`}
                      >
                        <span className="block font-black text-slate-900 text-xs">
                          {pack.label}
                        </span>
                        <span className="block text-[11px] font-bold text-slate-700 mt-0.5">
                          ₹{discountedTotal.toLocaleString('en-IN')}
                        </span>
                        <span className={`inline-block mt-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                          pack.discount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                        }`}>
                          {pack.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Cart or Out of Stock Alert */}
            <div className="pt-2">
              {product.inStock ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Stepper (Number of packs/pieces) */}
                    <div className="flex items-center bg-slate-100/80 border border-slate-200/90 rounded-2xl p-1 shrink-0 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-slate-700 hover:text-slate-950 flex items-center justify-center font-bold text-base shadow-2xs active:scale-90 transition-all cursor-pointer"
                        aria-label="Decrease quantity"
                      >−</button>
                      <span className="w-8 sm:w-10 text-center font-black text-sm text-slate-900 select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-slate-700 hover:text-slate-950 flex items-center justify-center font-bold text-base shadow-2xs active:scale-90 transition-all cursor-pointer"
                        aria-label="Increase quantity"
                      >+</button>
                    </div>

                    {/* Premium Add to Bag CTA Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`flex-1 h-11 sm:h-12 rounded-2xl font-black text-xs sm:text-sm tracking-wide text-white flex items-center justify-between px-4 sm:px-5 transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md ${
                        isJustAdded
                          ? 'bg-emerald-600 shadow-emerald-600/30'
                          : isPlants
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 hover:shadow-emerald-600/35'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25 hover:shadow-blue-600/35'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isJustAdded ? (
                          <Check className="h-4 w-4 text-emerald-200 shrink-0 animate-bounce" />
                        ) : (
                          <ShoppingBag className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">
                          {isJustAdded 
                            ? 'Added to Bag!' 
                            : `Add ${quantity > 1 ? `${quantity} ` : ''}${selectedPackQty > 1 ? `(Pack of ${selectedPackQty})` : 'to Bag'}`}
                        </span>
                      </div>
                      <span className="bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-black tracking-tight shrink-0 ml-2">
                        ₹{calculatedTotalPrice.toLocaleString('en-IN')}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-2.5">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold text-center">
                    Currently Sold Out at Verified Nurseries
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStockAlertOpen(true)}
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Bell className="h-4 w-4 animate-bounce" />
                    <span>Notify Me When in Stock</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Trust strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'Express Shipping', sub: 'Temperature-controlled', color: `${theme.text} ${theme.bgLight}` },
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

          {/* Vendor badge */}
          {vendor && (
            <Link
              href={shopHref}
              className={`inline-flex items-center gap-2 w-fit text-sm text-slate-600 ${theme.hoverText} transition-colors group mb-1`}
            >
              <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${isPlants ? 'from-emerald-500 to-emerald-700 border-emerald-200' : 'from-blue-500 to-blue-700 border-blue-200'} flex items-center justify-center overflow-hidden border shrink-0`}>
                {vendor.logo ? (
                  <img src={vendor.logo} alt={vendor.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[9px] font-black text-white">{vendor.name.charAt(0)}</span>
                )}
              </div>
              <span className={`font-semibold ${theme.groupHoverText}`}>{vendor.name}</span>
              <CheckCircle2 className={`h-3.5 w-3.5 ${isPlants ? 'text-emerald-500' : 'text-blue-500'}`} />
            </Link>
          )}
        </div>
      </div>

      {/* ─────── FREQUENTLY BOUGHT TOGETHER BUNDLE ─────── */}
      <FrequentlyBoughtTogether
        currentProduct={product}
        recommendations={initialRecommendations}
      />

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
                    ? `${theme.border} ${theme.text}`
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? theme.text : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-b-2xl rounded-t-none border border-t-0 border-slate-200/80 p-6 md:p-8 min-h-[280px]">

            {activeTab === 'description' && (
              <div className="max-w-4xl space-y-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">About {product.title}</h3>
                
                <div className="relative">
                  <div className={`prose prose-slate prose-base max-w-none space-y-6 transition-all duration-300 ${!isDescExpanded ? 'max-h-48 overflow-hidden relative' : ''}`}>
                    {product.quickOverview && (
                      <p className="text-base font-bold text-slate-800 leading-relaxed">
                        {product.quickOverview}
                      </p>
                    )}
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {product.description || 'Premium aquatic specimen, quarantine-tested and ready for your tank setup.'}
                    </p>

                    {product.aboutSpecies && (
                      <div className="pt-2">
                        <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Info className={`h-5 w-5 ${theme.icon}`}/> Species Profile</h4>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.aboutSpecies}</p>
                      </div>
                    )}
                    {product.behavioralTraits && (
                      <div className="pt-2">
                        <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500"/> Behavior & Temperament</h4>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.behavioralTraits}</p>
                      </div>
                    )}
                    {product.genderIdentification && (
                      <div className="pt-2">
                        <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><User className="h-5 w-5 text-pink-500"/> Male vs Female Identification</h4>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.genderIdentification}</p>
                      </div>
                    )}
                    {product.sustainabilitySourcing && (
                      <div className="pt-2">
                        <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Leaf className="h-5 w-5 text-emerald-500"/> Sustainability & Sourcing</h4>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.sustainabilitySourcing}</p>
                      </div>
                    )}
                    {product.section5Title && product.section5Content && (
                      <div className="pt-2">
                        <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Store className="h-5 w-5 text-purple-500"/> {product.section5Title}</h4>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.section5Content}</p>
                      </div>
                    )}
                  </div>

                  {!isDescExpanded && (
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                  )}

                  <div className="mt-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${theme.btn}`}
                    >
                      {isDescExpanded ? 'See Less' : 'See More'}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDescExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
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
                    { title: "Common Name", value: product.title, icon: Sparkles, color: `${theme.text} ${theme.bgLight}` },
                    { title: "Scientific Name", value: product.scientific || 'N/A', icon: Leaf, color: "text-emerald-600 bg-emerald-50" },
                    { title: "Water Type", value: product.waterType, icon: Droplets, color: "text-cyan-600 bg-cyan-50" },
                    { title: "pH Range", value: `${product.phMin ?? '6.0'} – ${product.phMax ?? '8.0'}`, icon: Droplets, color: "text-teal-600 bg-teal-50" },
                    { title: "Temperature", value: `${product.tempMin ?? '20'}°C – ${product.tempMax ?? '30'}°C`, icon: Thermometer, color: "text-rose-600 bg-rose-50" },
                    ...(product.category === 'Plants' ? [
                      { title: "Lighting", value: product.lightingRequirement || 'Medium', icon: Sparkles, color: "text-amber-600 bg-amber-50" },
                      { title: "CO2", value: product.co2Requirement || 'Recommended', icon: Leaf, color: "text-emerald-600 bg-emerald-50" },
                      { title: "Growth Rate", value: product.growthRate || 'Moderate', icon: Activity, color: "text-emerald-600 bg-emerald-50" },
                      { title: "Placement", value: product.placement || 'Midground', icon: Store, color: "text-indigo-600 bg-indigo-50" },
                      { title: "Difficulty", value: product.careDifficulty || 'Moderate', icon: ShieldAlert, color: "text-rose-600 bg-rose-50" },
                    ] : [
                      { title: "Temperament", value: product.temperament || 'Peaceful', icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
                    ]),
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

                {/* Deep Care Requirements */}
                <div className="pt-10 border-t border-slate-100 mt-10">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Detailed Care Guide</h3>
                  <div className="prose prose-slate prose-base max-w-4xl space-y-10">
                    {product.careTemp && (
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Thermometer className="h-5 w-5 text-rose-500"/> Temperature Requirements</h4>
                        <p className="text-slate-600 leading-loose whitespace-pre-wrap">{product.careTemp}</p>
                      </div>
                    )}
                    {product.carePh && (
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Droplets className="h-5 w-5 text-teal-500"/> pH Level & Chemistry</h4>
                        <p className="text-slate-600 leading-loose whitespace-pre-wrap">{product.carePh}</p>
                      </div>
                    )}
                    {product.careWaterHardness && (
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-blue-500"/> Water Hardness</h4>
                        <p className="text-slate-600 leading-loose whitespace-pre-wrap">{product.careWaterHardness}</p>
                      </div>
                    )}
                    {product.careWaterCurrent && (
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Activity className="h-5 w-5 text-cyan-500"/> Water Current & Aeration</h4>
                        <p className="text-slate-600 leading-loose whitespace-pre-wrap">{product.careWaterCurrent}</p>
                      </div>
                    )}
                    {product.careTankSetup && (
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Box className="h-5 w-5 text-indigo-500"/> Tank Setup & Housing</h4>
                        <p className="text-slate-600 leading-loose whitespace-pre-wrap">{product.careTankSetup}</p>
                      </div>
                    )}
                    {product.careHidingSpots && (
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Home className="h-5 w-5 text-emerald-500"/> {product.category === 'Plants' ? 'Substrate & Decor' : 'Hiding Spots & Decor'}</h4>
                        <p className="text-slate-600 leading-loose whitespace-pre-wrap">{product.careHidingSpots}</p>
                      </div>
                    )}
                    
                    {!product.careTemp && !product.carePh && !product.careTankSetup && (
                      <p className="text-slate-500 italic">No detailed care guidelines provided for this product.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="max-w-3xl space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Shipping & Guarantees</h3>
                <div className="space-y-5">
                  {[
                    { icon: Shield, color: 'text-emerald-600 bg-emerald-50', title: '100% Live Arrival Guarantee', desc: 'All live specimens arrive healthy. DOA claims require a photo and video of the unopened bag within 2 hours of delivery for a full credit or replacement.' },
                    { icon: Info, color: `${theme.text} ${theme.bgLight}`, title: 'Return & Replacement Policy', desc: 'Due to biosecurity standards, physical returns of live fish, plants, or invertebrates cannot be accepted. Contact support for post-acclimation advice.' },
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

      {/* Horizontal Recommendations Section (Same Vendor / Breeder) */}
      {initialRecommendations.length > 0 && (
        <div className="mt-12 pt-10 border-t border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className={`text-[11px] font-bold ${theme.text} uppercase tracking-widest`}>
                {vendor?.name ? `${vendor.name}'s Collection` : 'Breeder Collection'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
                More from {vendor?.name || 'this Breeder'}
              </h3>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              {vendor && (
                <Link
                  href={`/shop/${vendor.slug || vendor._id}`}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:${theme.text} transition-colors mr-1 sm:mr-3`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Visit Storefront</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => recScrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
                  className="h-8.5 w-8.5 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-2xs active:scale-95"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => recScrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
                  className="h-8.5 w-8.5 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-2xs active:scale-95"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal scroll list */}
          <div
            ref={recScrollRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {initialRecommendations.map((rec, idx) => (
              <div key={rec._id} className="w-[200px] sm:w-[230px] md:w-[250px] shrink-0 snap-start">
                <ProductCard product={rec} idx={idx} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Alert Modal */}
      <StockAlertModal
        isOpen={isStockAlertOpen}
        onClose={() => setIsStockAlertOpen(false)}
        productId={product._id}
        productTitle={product.title}
        productImage={product.images?.[0]}
      />
    </>
  );
}
