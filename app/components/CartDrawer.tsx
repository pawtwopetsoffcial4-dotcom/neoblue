"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Package, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  CreditCard,
  Scale
} from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useMode } from '@/lib/hooks/useMode';

/**
 * Calculates shipping parcel weight utilization and remaining capacity.
 * Slabs: 250g, 500g, 1000g (1kg), 1500g (1.5kg), 2000g (2kg), 3000g (3kg), 5000g (5kg)
 */
export function calculateParcelCapacity(items: any[]) {
  let totalWeightGrams = 0;
  let totalSavings = 0;

  for (const item of items) {
    const weightPerPiece = item.weightPerPiece && item.weightPerPiece > 0
      ? item.weightPerPiece
      : (item.category === 'Plants' ? 80 : 100); // Sensible default weight per piece

    totalWeightGrams += weightPerPiece * item.quantity;

    if (item.originalPrice && item.originalPrice > item.price) {
      totalSavings += (item.originalPrice - item.price) * item.quantity;
    } else if (item.discountPercentage && item.discountPercentage > 0) {
      const orig = Math.round(item.price / (1 - item.discountPercentage / 100));
      totalSavings += (orig - item.price) * item.quantity;
    }
  }

  // Weight slabs in grams: 250g, 500g, 1kg, 1.5kg, 2kg, 3kg, 5kg
  const SLABS = [250, 500, 1000, 1500, 2000, 3000, 5000];

  let currentSlab = SLABS[0];
  for (const slab of SLABS) {
    if (totalWeightGrams <= slab) {
      currentSlab = slab;
      break;
    }
    currentSlab = slab;
  }

  if (totalWeightGrams > SLABS[SLABS.length - 1]) {
    currentSlab = Math.ceil(totalWeightGrams / 1000) * 1000;
  }

  const remainingWeight = Math.max(0, currentSlab - totalWeightGrams);
  const percentageUsed = currentSlab > 0 
    ? Math.min(100, Math.round((totalWeightGrams / currentSlab) * 100)) 
    : 0;

  const formatWeight = (g: number) => {
    if (g >= 1000) {
      const kg = g / 1000;
      return `${Number.isInteger(kg) ? kg : kg.toFixed(1)}kg`;
    }
    return `${g}g`;
  };

  return {
    totalWeightGrams,
    currentSlabGrams: currentSlab,
    remainingWeightGrams: remainingWeight,
    percentageUsed,
    formattedTotalWeight: formatWeight(totalWeightGrams),
    formattedCurrentSlab: formatWeight(currentSlab),
    formattedRemainingWeight: formatWeight(remainingWeight),
    isFull: remainingWeight === 0,
    totalSavings,
  };
}

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, updateQuantity, removeFromCart, addToCart, totalAmount, cartCount } = useCart();
  const { mode } = useMode();
  const isPlants = mode === 'plants';
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const capacity = useMemo(() => calculateParcelCapacity(items), [items]);

  // Top Vendor Detection for Upsells
  const topVendorId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if ((item as any).vendorId) {
        const rawVendor = (item as any).vendorId;
        const id = typeof rawVendor === 'object' && rawVendor !== null ? (rawVendor._id || rawVendor.id) : rawVendor;
        if (id) counts[String(id)] = (counts[String(id)] || 0) + item.quantity;
      }
    }
    let maxCount = 0;
    let topId: string | null = null;
    for (const [vId, c] of Object.entries(counts)) {
      if (c > maxCount) {
        maxCount = c;
        topId = vId;
      }
    }
    return topId;
  }, [items]);

  const [upsellProducts, setUpsellProducts] = useState<any[]>([]);
  const [isUpsellLoading, setIsUpsellLoading] = useState(false);

  useEffect(() => {
    if (!isCartOpen || items.length === 0 || totalAmount >= 599) {
      return;
    }

    const fetchUpsells = async () => {
      try {
        setIsUpsellLoading(true);
        const url = topVendorId 
          ? `/api/products?vendorId=${topVendorId}&limit=8` 
          : `/api/products?limit=8`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.products) ? data.products : (Array.isArray(data.data?.products) ? data.data.products : (Array.isArray(data) ? data : []));
          const existingIds = new Set(items.map(i => String(i.productId)));
          const filtered = list.filter((p: any) => !existingIds.has(String(p._id || p.id)) && p.inStock);
          setUpsellProducts(filtered.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load upsells:', err);
      } finally {
        setIsUpsellLoading(false);
      }
    };

    fetchUpsells();
  }, [isCartOpen, topVendorId, items.length, totalAmount]);

  const theme = isPlants ? {
    accent: 'emerald',
    badgeBg: 'bg-emerald-600',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/20',
    progressBg: 'bg-emerald-600',
    bannerBg: 'bg-emerald-50/90 border-emerald-200/80',
    bannerText: 'text-emerald-950',
    bannerIconBg: 'bg-emerald-100 text-emerald-700',
    pillBorder: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  } : {
    accent: 'blue',
    badgeBg: 'bg-blue-600',
    btnBg: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-600/20',
    progressBg: 'bg-blue-600',
    bannerBg: 'bg-blue-50/90 border-blue-200/80',
    bannerText: 'text-blue-950',
    bannerIconBg: 'bg-blue-100 text-blue-700',
    pillBorder: 'border-blue-200 text-blue-700 bg-blue-50',
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] transition-opacity duration-300 animate-in fade-in"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div 
          ref={drawerRef}
          className="w-full sm:w-[425px] sm:max-w-[425px] h-[100dvh] max-h-[100dvh] bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200/80 animate-in slide-in-from-right duration-300 ease-out"
        >
          {/* Header */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold shadow-xs ${theme.badgeBg}`}>
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Your Cart <span className="text-sm font-extrabold text-slate-400">({cartCount})</span>
              </h2>
            </div>
            
            <button
              onClick={closeCart}
              className="h-8.5 w-8.5 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close Cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Shipping Parcel Optimization Banner / Capacity Meter */}
          {items.length > 0 && (
            <div className="px-3.5 sm:px-4 pt-2.5 shrink-0">
              <div className={`p-3 rounded-2xl border ${theme.bannerBg} shadow-2xs space-y-2`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-6.5 w-6.5 rounded-lg flex items-center justify-center shrink-0 ${theme.bannerIconBg}`}>
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <p className={`text-xs font-black truncate ${theme.bannerText}`}>
                      {capacity.remainingWeightGrams > 0 ? (
                        <>Add <span className="underline decoration-2">{capacity.formattedRemainingWeight}</span> for SAME shipping!</>
                      ) : (
                        <>Box 100% full with max shipping value!</>
                      )}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200/60 shrink-0 text-slate-700 shadow-2xs`}>
                    {capacity.percentageUsed}% Box Filled
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/90 border border-slate-200/60 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${theme.progressBg}`}
                    style={{ width: `${Math.max(8, capacity.percentageUsed)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3 h-3 text-slate-400" />
                    Parcel used: <strong className="text-slate-900">{capacity.formattedTotalWeight}</strong>
                  </span>
                  <span>
                    Slab limit: <strong className="text-slate-900">{capacity.formattedCurrentSlab}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cart Items List (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 divide-y divide-slate-100 min-h-0">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-slate-800">Your cart is empty</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Explore our curated collection of live aquarium fish, rare shrimps, and planted tank flora.
                  </p>
                </div>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className={`inline-flex h-11 items-center justify-center px-6 rounded-xl text-white font-extrabold text-xs tracking-wider uppercase transition-all active:scale-95 ${theme.btnBg}`}
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                {items.map((item) => {
                  const itemWeight = (item.weightPerPiece || (item.category === 'Plants' ? 80 : 100)) * item.quantity;
                  return (
                    <div key={item.productId} className="pt-3 first:pt-0 flex gap-3 sm:gap-3.5 items-start group">
                      {/* Item Thumbnail */}
                      <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 relative">
                        <img
                          src={item.image || '/illustrations/placeholder.png'}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs sm:text-[13px] font-black text-slate-900 truncate leading-snug" title={item.title}>
                              {item.title}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Specs & Weight Tags */}
                          {(() => {
                            const rawId = String(item.productId || '');
                            const packNum = item.packQty || (rawId.includes('_pack_') ? parseInt(rawId.split('_pack_')[1], 10) : (item.unitLabel?.startsWith('Pack of ') ? parseInt(item.unitLabel.replace('Pack of ', ''), 10) : 1));
                            const isPair = item.unitLabel === 'pair' || item.perPairPrice != null;
                            const displayUnit = item.unitLabel || (packNum > 1 ? `Pack of ${packNum}` : (isPair ? 'pair' : 'piece'));
                            const badgeText = displayUnit.startsWith('Pack') ? displayUnit : `1 ${displayUnit}`;

                            return (
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                  {badgeText}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-semibold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded-md">
                                  {itemWeight}g
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Price & Quantity Stepper */}
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium ml-1">
                                {(() => {
                                  const rawId = String(item.productId || '');
                                  const packNum = item.packQty || (rawId.includes('_pack_') ? parseInt(rawId.split('_pack_')[1], 10) : (item.unitLabel?.startsWith('Pack of ') ? parseInt(item.unitLabel.replace('Pack of ', ''), 10) : 1));
                                  return packNum > 1 ? `(₹${item.price} / pack)` : `(₹${item.price} ea)`;
                                })()}
                              </span>
                            )}
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center border border-slate-200/90 rounded-xl bg-slate-50/80 p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="h-5.5 w-5.5 sm:h-6 sm:w-6 rounded-lg bg-white text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs active:scale-95 disabled:opacity-40 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 sm:w-7 text-center text-xs font-black text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="h-5.5 w-5.5 sm:h-6 sm:w-6 rounded-lg bg-white text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs active:scale-95 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}



                {/* Vendor Upsell Recommendations (to bridge to ₹599 free shipping) */}
                {totalAmount < 599 && upsellProducts.length > 0 && (
                  <div className="pt-3.5 pb-1 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                        <h4 className="text-[11px] font-black text-slate-900 tracking-tight uppercase">
                          Add to Unlock 🔓 Free Shipping
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full">
                        Add ₹{Math.max(0, 599 - totalAmount)} more
                      </span>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {upsellProducts.map((up) => (
                        <div 
                          key={up._id || up.id}
                          className="w-32 sm:w-36 shrink-0 bg-slate-50 border border-slate-200/80 rounded-2xl p-2 flex flex-col justify-between transition-all hover:border-slate-300"
                        >
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white mb-1.5 border border-slate-100">
                            <img 
                              src={up.images?.[0] || up.img || '/illustrations/placeholder.png'} 
                              alt={up.title} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 truncate leading-tight" title={up.title}>{up.title}</p>
                          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-200/60">
                            <span className="text-[11px] sm:text-xs font-black text-slate-900">₹{up.price}</span>
                            <button
                              type="button"
                              onClick={() => {
                                addToCart(up, 1, true, {
                                  packQty: 1,
                                  unitLabel: up.perPairPrice != null ? 'pair' : 'piece',
                                  customPrice: up.price,
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-[10px] font-extrabold cursor-pointer transition-all shadow-2xs"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust Badges inside Scrollable Area */}
                <div className="pt-4 pb-2 border-t border-slate-100 flex flex-col items-center gap-1.5 text-center">
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Live Arrival Guarantee
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-700" /> Insulated Box
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 pt-0.5 text-[9px] text-slate-400 font-medium">
                    <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-bold">UPI</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-bold">GPay</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-bold">Cards</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-bold">NetBanking</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Compact Sticky Footer Area with Subtotal & Checkout Button */}
          {items.length > 0 && (
            <div className="border-t border-slate-100 bg-white p-3.5 sm:p-4 space-y-2.5 shrink-0 shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {/* Savings Ribbon */}
              {capacity.totalSavings > 0 && (
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black text-pink-600 bg-pink-50 border border-pink-200/80 shadow-2xs">
                    <Sparkles className="w-3 h-3" />
                    You Save ₹{capacity.totalSavings.toLocaleString('en-IN')} on this order!
                  </span>
                </div>
              )}

              {/* Subtotal row */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Cart Subtotal
                  </span>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                    {totalAmount >= 599 ? '🎉 Free Shipping on single-seller orders' : 'Standard Shipping ₹99 at checkout'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg sm:text-xl font-black text-slate-900">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Order & Free Shipping Threshold Progress Bar */}
              {(() => {
                const MIN_ORDER_AMOUNT = 149;
                const FREE_SHIPPING_AMOUNT = 599;

                const isMinOrderMet = totalAmount >= MIN_ORDER_AMOUNT;
                const isFreeShippingMet = totalAmount >= FREE_SHIPPING_AMOUNT;
                const remainingForMinOrder = Math.max(0, MIN_ORDER_AMOUNT - totalAmount);
                const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_AMOUNT - totalAmount);
                const freeShippingPercentage = Math.min(100, Math.round((totalAmount / FREE_SHIPPING_AMOUNT) * 100));

                return (
                  <>
                    <div className={`p-2.5 rounded-xl border text-xs ${
                      !isMinOrderMet
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                        : isFreeShippingMet
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/80 border-amber-200 text-amber-900'
                    }`}>
                      <div className="flex items-center justify-between font-bold mb-1 text-[10px] sm:text-[11px]">
                        <span className="flex items-center gap-1">
                          {!isMinOrderMet ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
                              <span>Min. Order Value: ₹149</span>
                            </>
                          ) : isFreeShippingMet ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>🎉 FREE Shipping Unlocked!</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Add ₹{remainingForFreeShipping} for <strong>FREE Shipping</strong></span>
                            </>
                          )}
                        </span>
                        <span className="font-extrabold shrink-0 ml-1">
                          {!isMinOrderMet
                            ? `Add ₹${remainingForMinOrder}`
                            : isFreeShippingMet
                            ? '✓ Free Delivery'
                            : `Add ₹${remainingForFreeShipping}`}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                        <div 
                           className={`h-full rounded-full transition-all duration-500 ${
                            !isMinOrderMet ? 'bg-rose-500' : isFreeShippingMet ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(6, freeShippingPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Checkout CTA Button */}
                    {isMinOrderMet ? (
                      <Link
                        href="/checkout"
                        onClick={closeCart}
                        className={`w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl text-white font-black text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-between px-4 sm:px-5 active:scale-[0.99] cursor-pointer ${theme.btnBg}`}
                      >
                        <span>Checkout Now</span>
                        <span className="flex items-center gap-1 text-xs font-bold opacity-90">
                          Proceed <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={closeCart}
                        className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-100 text-rose-900 border border-rose-300 font-black text-xs tracking-wider uppercase flex items-center justify-between px-4 sm:px-5 cursor-pointer hover:bg-rose-200 transition-all active:scale-[0.99]"
                      >
                        <span>Add ₹{remainingForMinOrder} more to Order (Min ₹149)</span>
                        <span className="flex items-center gap-1 font-bold">
                          Add Items <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
