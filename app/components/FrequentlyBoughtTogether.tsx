"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';

interface FrequentlyBoughtTogetherProps {
  currentProduct: MarketplaceProduct;
  recommendations: MarketplaceProduct[];
}

export default function FrequentlyBoughtTogether({
  currentProduct,
  recommendations,
}: FrequentlyBoughtTogetherProps) {
  const { addToCart } = useCart();

  // Pick up to 2 smart complementary items
  const bundleItems = useMemo(() => {
    if (!recommendations || recommendations.length === 0) return [];
    
    // Filter available stock only and exclude current product
    const available = recommendations.filter(
      (p) => p._id !== currentProduct._id && p.inStock
    );

    // Prioritize different categories for true cross-selling
    const differentCategory = available.find((p) => p.category !== currentProduct.category);
    const sameCategory = available.find((p) => p._id !== differentCategory?._id);

    const picked: MarketplaceProduct[] = [];
    if (differentCategory) picked.push(differentCategory);
    if (sameCategory && picked.length < 2) picked.push(sameCategory);
    if (picked.length === 0 && available.length > 0) {
      picked.push(...available.slice(0, 2));
    }

    return picked;
  }, [currentProduct, recommendations]);

  // Track selection: current product is always checked, others can be toggled
  const [selectedIds, setSelectedIds] = useState<string[]>([
    currentProduct._id,
    ...bundleItems.map((item) => item._id),
  ]);
  const [isAdded, setIsAdded] = useState(false);

  // Sync selectedIds when bundleItems change
  React.useEffect(() => {
    setSelectedIds([currentProduct._id, ...bundleItems.map((item) => item._id)]);
  }, [currentProduct._id, bundleItems]);

  if (bundleItems.length === 0) return null;

  const allItems = [currentProduct, ...bundleItems];

  const toggleItem = (id: string) => {
    if (id === currentProduct._id) return; // cannot unselect primary item
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const selectedProducts = allItems.filter((item) => selectedIds.includes(item._id));
  const rawSubtotal = selectedProducts.reduce((sum, item) => sum + item.price, 0);
  const bundleDiscount = selectedProducts.length >= 2 ? Math.round(rawSubtotal * 0.05) : 0; // 5% bundle savings
  const finalBundlePrice = rawSubtotal - bundleDiscount;

  const handleAddBundle = () => {
    selectedProducts.forEach((prod) => {
      addToCart(prod);
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mt-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider mb-1">
            <Sparkles className="h-3 w-3" /> Smart Aquarium Pairing
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            Frequently Bought Together
          </h3>
        </div>
        {bundleDiscount > 0 && (
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            Save 5% (₹{bundleDiscount}) on this combo
          </span>
        )}
      </div>

      {/* Visual Product Formula Row */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2">
        {allItems.map((item, index) => {
          const isSelected = selectedIds.includes(item._id);
          const isPrimary = item._id === currentProduct._id;

          return (
            <React.Fragment key={item._id}>
              {index > 0 && (
                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-400 font-bold flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4" />
                </div>
              )}

              <div
                onClick={() => !isPrimary && toggleItem(item._id)}
                className={`relative group rounded-2xl p-3 border transition-all cursor-pointer flex flex-col items-center w-28 sm:w-36 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/40 opacity-60'
                }`}
              >
                {/* Checkbox indicator */}
                <div className="absolute top-2 left-2 z-10">
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </div>

                {isPrimary && (
                  <span className="absolute top-2 right-2 text-[9px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded-md uppercase">
                    This item
                  </span>
                )}

                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden mb-2 bg-slate-100">
                  <Image
                    src={item.images?.[0] || '/logo.png'}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="96px"
                  />
                </div>

                <p className="text-[11px] font-bold text-slate-800 text-center line-clamp-2 leading-tight">
                  {item.title}
                </p>
                <p className="text-xs font-black text-slate-900 mt-1">
                  ₹{item.price.toLocaleString('en-IN')}
                </p>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Action / Checkout Ribbon */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60 p-4 rounded-2xl">
        <div>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
            Bundle Total ({selectedProducts.length} items):
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900">
              ₹{finalBundlePrice.toLocaleString('en-IN')}
            </span>
            {bundleDiscount > 0 && (
              <span className="text-xs font-bold text-slate-400 line-through">
                ₹{rawSubtotal.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddBundle}
          disabled={selectedProducts.length === 0}
          className={`h-12 px-6 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-md ${
            isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="h-4 w-4" />
              <span>Added to Bag!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              <span>Add Selected ({selectedProducts.length}) to Bag</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
