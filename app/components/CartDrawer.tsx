"use client";

import React, { useEffect, useMemo, useRef } from 'react';
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
  const { items, isCartOpen, closeCart, updateQuantity, removeFromCart, totalAmount, cartCount } = useCart();
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
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {item.unitLabel ? `1 ${item.unitLabel}` : 'piece'}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-semibold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded-md">
                              {itemWeight}g
                            </span>
                          </div>
                        </div>

                        {/* Price & Quantity Stepper */}
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium ml-1">
                                (₹{item.price} ea)
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

                {/* Trust Badges inside Scrollable Area */}
                <div className="pt-4 pb-2 border-t border-slate-100 flex flex-col items-center gap-1.5 text-center">
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Live Arrival Guarantee
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600" /> Insulated Box
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
                    Estimated Total
                  </span>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                    Taxes & shipping calculated at checkout
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg sm:text-xl font-black text-slate-900">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Minimum Order Value Progress Bar */}
              {(() => {
                const MIN_ORDER_AMOUNT = 599;
                const isMinOrderMet = totalAmount >= MIN_ORDER_AMOUNT;
                const remainingForMinOrder = Math.max(0, MIN_ORDER_AMOUNT - totalAmount);
                const minOrderPercentage = Math.min(100, Math.round((totalAmount / MIN_ORDER_AMOUNT) * 100));

                return (
                  <>
                    <div className={`p-2.5 rounded-xl border text-xs ${
                      isMinOrderMet 
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                        : 'bg-amber-50/80 border-amber-200 text-amber-900'
                    }`}>
                      <div className="flex items-center justify-between font-bold mb-1 text-[10px] sm:text-[11px]">
                        <span className="flex items-center gap-1">
                          {isMinOrderMet ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Minimum Order Met (₹599)</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                              <span>Min. Order Value: ₹599</span>
                            </>
                          )}
                        </span>
                        <span className="font-extrabold">
                          {isMinOrderMet ? '✓ Ready' : `Add ₹${remainingForMinOrder} more`}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMinOrderMet ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${minOrderPercentage}%` }}
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
                        className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100/90 text-amber-900 border border-amber-300/80 font-black text-xs tracking-wider uppercase flex items-center justify-between px-4 sm:px-5 cursor-pointer hover:bg-amber-200 transition-all active:scale-[0.99]"
                      >
                        <span>Add ₹{remainingForMinOrder} more to Order</span>
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
