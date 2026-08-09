'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package, ShoppingCart, Star, Tag, ChevronRight, Check,
  Truck, Shield, Zap, ArrowLeft, Plus, Minus
} from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';

type ProductDetail = {
  _id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  waterType: string;
  scientific?: string;
  vendorId?: { _id: string; name: string } | string;
  inStock?: boolean;
  approvalStatus?: string;
};

type ComboProduct = {
  productId: ProductDetail;
  quantity: number;
  customImage?: string;
};

type Combo = {
  _id: string;
  name: string;
  description: string;
  products: ComboProduct[];
  price: number;
  originalPrice?: number;
  coverImage: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  tag?: string;
  shippingCharge?: number;
  createdAt: string;
};

function savingsPercent(price: number, original?: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

const FEATURES = [
  { icon: Truck, label: 'Live Arrival Guarantee', desc: 'We guarantee live delivery or a full replacement' },
  { icon: Shield, label: 'Quarantine Tested', desc: 'All specimens health-checked before shipping' },
  { icon: Zap, label: 'Express Packaging', desc: 'Oxygen-packed insulated boxes for safe transit' },
];

export default function ComboDetailClient({ combo }: { combo: Combo }) {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const [activeImage, setActiveImage] = useState(combo.coverImage);
  const [addedAll, setAddedAll] = useState(false);

  const savings = savingsPercent(combo.price, combo.originalPrice);
  const allImages = [combo.coverImage, ...(combo.images ?? [])].filter(Boolean);

  // Cart state check: combo is "in cart" if all its products are present
  const comboInCart = combo.products.every((cp) =>
    items.find((i) => i.productId === cp.productId._id)
  );

  const handleAddComboToCart = () => {
    combo.products.forEach((cp) => {
      const product = cp.productId;
      const cartItem = items.find((i) => i.productId === product._id);
      if (cartItem) {
        // Already in cart — bump quantity by combo quantity
        updateQuantity(product._id, cartItem.quantity + cp.quantity);
      } else {
        // Add fresh
        addToCart({
          _id: product._id,
          title: product.title,
          price: combo.price, // distribute combo price proportionally? Keep simple: use combo price as a single cart entry
          images: product.images,
          category: product.category,
          waterType: product.waterType,
          vendorId: typeof product.vendorId === 'object' ? (product.vendorId as any)?._id : product.vendorId,
          rating: 5,
          inStock: product.inStock !== false,
          approvalStatus: 'approved',
        } as any);
      }
    });
    setAddedAll(true);
    setTimeout(() => setAddedAll(false), 2500);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/combos" className="hover:text-blue-600 transition-colors">Combos</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-800 font-medium truncate">{combo.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Left: Images ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
              <img
                src={activeImage}
                alt={combo.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === img ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt={`${combo.name} view ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Info ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24 self-start">

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {combo.isFeatured && (
                <span className="flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                  <Star className="h-3 w-3 fill-current" /> Featured
                </span>
              )}
              {combo.tag && (
                <span className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                  <Tag className="h-3 w-3" /> {combo.tag}
                </span>
              )}
              {savings > 0 && (
                <span className="text-xs font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full">
                  Save {savings}%
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{combo.name}</h1>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">{combo.description}</p>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">₹{combo.price.toLocaleString('en-IN')}</span>
                {combo.originalPrice && (
                  <>
                    <span className="text-lg text-slate-400 line-through">₹{combo.originalPrice.toLocaleString('en-IN')}</span>
                    <span className="text-sm font-bold text-emerald-600">
                      You save ₹{(combo.originalPrice - combo.price).toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Truck className="h-3.5 w-3.5" />
                {combo.shippingCharge && combo.shippingCharge > 0
                  ? `+ ₹${combo.shippingCharge} shipping`
                  : 'Shipping calculated at checkout'}
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAddComboToCart}
                disabled={addedAll}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  addedAll
                    ? 'bg-emerald-500 text-white cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-95'
                }`}
              >
                {addedAll ? (
                  <><Check className="h-5 w-5" /> All items added to cart!</>
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Add Entire Combo to Cart</>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center">
                Adds all {combo.products.length} products to your cart at once
              </p>
            </div>

            {/* Included products */}
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                What's Included ({combo.products.length} items)
              </h2>
              <div className="space-y-2.5">
                {combo.products.map((cp, i) => {
                  const p = cp.productId;
                  return (
                    <Link
                      key={i}
                      href={`/products/${p._id}`}
                      className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:border-blue-200 hover:shadow-sm transition-all group"
                    >
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                        {(cp.customImage || p.images?.[0]) && (
                          <img src={cp.customImage || p.images[0]} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{p.title}</p>
                        {p.scientific && <p className="text-xs text-slate-400 italic">{p.scientific}</p>}
                        <p className="text-xs text-slate-500">{p.category} · {p.waterType}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-500">Qty</p>
                        <p className="text-sm font-bold text-slate-800">{cp.quantity}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-slate-100">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-12">
          <Link
            href="/combos"
            className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all combos
          </Link>
        </div>
      </div>
    </main>
  );
}
