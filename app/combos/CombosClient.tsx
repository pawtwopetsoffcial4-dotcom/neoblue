'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ArrowRight, Tag, Star, ShoppingBag, Loader2 } from 'lucide-react';

type ComboProduct = {
  productId: {
    _id: string;
    title: string;
    price: number;
    images: string[];
  };
  quantity: number;
};

type Combo = {
  _id: string;
  name: string;
  description: string;
  products: ComboProduct[];
  price: number;
  originalPrice?: number;
  coverImage: string;
  isActive: boolean;
  isFeatured: boolean;
  tag?: string;
};

function savingsPercent(price: number, original?: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export default function CombosClient() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'featured'>('all');

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const url = filter === 'featured' ? '/api/combos?featured=true' : '/api/combos';
        const res = await fetch(url);
        const data = await res.json();
        setCombos(data.combos ?? []);
      } catch {
        setCombos([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCombos();
  }, [filter]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%)' }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex items-center gap-2 text-blue-300 text-sm font-semibold mb-3">
            <Package className="h-4 w-4" />
            <span>Curated Bundles</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            Combo Packages
          </h1>
          <p className="text-blue-200 text-lg max-w-xl">
            Hand-picked collections of premium aquatic specimens, bundled together at exclusive prices — perfect for aquarists at any level.
          </p>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-8">
            {(['all', 'featured'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setFilter(tab); setIsLoading(true); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === tab
                    ? 'bg-white text-blue-900 shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {tab === 'all' ? 'All Combos' : '⭐ Featured'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : combos.length === 0 ? (
          <div className="text-center py-24">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No combos available yet</h3>
            <p className="text-sm text-slate-400 mt-1">Check back soon — curated bundles are coming!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {combos.map((combo) => {
              const savings = savingsPercent(combo.price, combo.originalPrice);
              return (
                <Link
                  key={combo._id}
                  href={`/combos/${combo._id}`}
                  className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {combo.coverImage ? (
                      <img
                        src={combo.coverImage}
                        alt={combo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-slate-300" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {combo.isFeatured && (
                        <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                          <Star className="h-3 w-3 fill-current" /> Featured
                        </span>
                      )}
                      {combo.tag && (
                        <span className="flex items-center gap-1 bg-white/90 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                          <Tag className="h-3 w-3" /> {combo.tag}
                        </span>
                      )}
                      {savings > 0 && (
                        <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                          {savings}% off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product thumbnails strip */}
                  {combo.products.length > 0 && (
                    <div className="flex items-center gap-1.5 px-4 pt-3">
                      {combo.products.slice(0, 4).map((cp, i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0"
                        >
                          {cp.productId?.images?.[0] && (
                            <img
                              src={cp.productId.images[0]}
                              alt={cp.productId.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                      {combo.products.length > 4 && (
                        <span className="text-xs text-slate-400 font-medium ml-1">
                          +{combo.products.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h2 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {combo.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex-1">{combo.description}</p>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <span className="text-lg font-black text-slate-900">₹{combo.price}</span>
                        {combo.originalPrice && (
                          <span className="text-xs text-slate-400 line-through ml-2">₹{combo.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{combo.products.length} items</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-blue-600 text-sm font-semibold">
                      View combo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
