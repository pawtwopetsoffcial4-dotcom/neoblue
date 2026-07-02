"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Fish, Leaf } from 'lucide-react';
import { useMode } from '@/lib/hooks/useMode';
import ReviewStars from '@/app/components/ReviewStars';

interface ProductItem {
  _id: string;
  title: string;
  category: string;
  subcategory?: string;
  waterType?: string;
  scientific?: string;
  rating?: number;
  reviewsCount?: number;
  price: number;
  images?: string[];
  perPairPrice?: number;
  perPiecePrice?: number;
}

interface CategoryDetailClientProps {
  slug: string;
  categoryTitle: string;
  filteredProducts: ProductItem[];
  subcategories: string[];
}

export default function CategoryDetailClient({
  slug,
  categoryTitle,
  filteredProducts,
  subcategories,
}: CategoryDetailClientProps) {
  const { mode, setMode } = useMode();
  const isPlantsCategory = slug.toLowerCase() === 'plants';

  // Check if current mode matches the category type
  const isModeMismatch =
    (mode === 'plants' && !isPlantsCategory) ||
    (mode === 'fishes' && isPlantsCategory);

  const handleSwitchMode = () => {
    setMode(isPlantsCategory ? 'plants' : 'fishes');
  };

  if (isModeMismatch) {
    return (
      <div className={`min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 font-sans transition-colors duration-500`}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-6 ${
            isPlantsCategory ? 'bg-green-50 text-green-600 animate-pulse' : 'bg-blue-50 text-blue-600 animate-pulse'
          }`}>
            {isPlantsCategory ? <Leaf className="h-8 w-8" /> : <Fish className="h-8 w-8" />}
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            Mode Mismatch
          </h2>
          
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {isPlantsCategory ? (
              <>You are currently browsing <strong>NEOBLUE (Fishes)</strong>. Plants are completely isolated in <strong>NEOBLUE PLANTS</strong>.</>
            ) : (
              <>You are currently browsing <strong>NEOBLUE PLANTS</strong>. <strong>{categoryTitle}</strong> is a fish/livestock category managed in <strong>NEOBLUE</strong>.</>
            )}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSwitchMode}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-md hover:shadow-lg hover:brightness-105 active:scale-98 transition-all duration-300 flex items-center justify-center gap-2 ${
                isPlantsCategory ? 'bg-green-700' : 'bg-blue-600'
              }`}
            >
              {isPlantsCategory ? (
                <>
                  <Leaf className="h-4 w-4" /> Switch to Plants Mode
                </>
              ) : (
                <>
                  <Fish className="h-4 w-4" /> Switch to Fishes Mode
                </>
              )}
            </button>
            
            <Link
              href="/categories"
              className="w-full py-3 px-6 rounded-2xl font-semibold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              Back to Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Under matching mode, apply dynamic theme styling
  const activeColor = mode === 'plants' ? 'green' : 'blue';

  return (
    <div className={`min-h-screen bg-white text-slate-900 pb-24 md:pb-0 font-sans transition-colors duration-500 ${
      mode === 'plants' ? 'selection:bg-green-500 selection:text-white' : 'selection:bg-blue-500 selection:text-white'
    }`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-10">
        <Link 
          href="/categories" 
          className={`inline-flex items-center gap-2 font-semibold mb-5 transition-colors ${
            activeColor === 'green' ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Categories
        </Link>

        <div className={`rounded-3xl border p-6 md:p-8 mb-8 transition-colors duration-500 ${
          activeColor === 'green' ? 'border-green-100 bg-green-50/60' : 'border-blue-100 bg-blue-50/60'
        }`}>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{categoryTitle}</h1>
          <p className="mt-3 text-slate-600 max-w-3xl">
            {activeColor === 'green'
              ? 'Curated live aquarium plants and aquascaping variants. Snail-free guaranteed.'
              : 'Premium live aquarium stock and tropical species. Live arrival guaranteed.'
            }
          </p>
          {subcategories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {subcategories.map((subcategory) => (
                <span
                  key={subcategory}
                  className={`inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 ${
                    activeColor === 'green' ? 'border-green-100' : 'border-blue-100'
                  }`}
                >
                  {subcategory}
                </span>
              ))}
            </div>
          )}
          <p className={`mt-4 text-sm font-semibold ${activeColor === 'green' ? 'text-green-700' : 'text-blue-700'}`}>
            {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} available
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <article 
                key={product._id} 
                className={`rounded-3xl overflow-hidden border bg-white shadow-sm transition-colors duration-300 ${
                  activeColor === 'green' ? 'border-green-100 hover:border-green-300' : 'border-blue-100 hover:border-blue-300'
                }`}
              >
                <img 
                  src={product.images?.[0] ?? '/api/placeholder/400/300'} 
                  alt={product.title} 
                  className="w-full aspect-[4/3] object-cover" 
                />
                <div className="p-5">
                  <p className={`text-xs uppercase tracking-wider mb-2 ${activeColor === 'green' ? 'text-green-600' : 'text-blue-600'}`}>
                    {product.category} {product.waterType ? `• ${product.waterType}` : ''}
                  </p>
                  <h2 className="text-xl font-bold text-slate-900">{product.title}</h2>
                  <p className="text-slate-600 text-sm italic mt-1">{product.scientific ?? 'Aquatic premium stock'}</p>
                  
                  {/* Rating stars */}
                  <div className="mt-2">
                    <ReviewStars rating={product.rating} count={product.reviewsCount} compact size={12} />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-black text-slate-900">₹{product.price.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        /{product.perPairPrice != null && typeof product.perPairPrice === 'number' ? 'Pair' : 'Piece'}
                      </span>
                    </div>
                    <Link 
                      href={`/products/${product._id}`} 
                      className={`inline-flex items-center gap-2 font-semibold transition-colors ${
                        activeColor === 'green' ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      View <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className={`text-center py-20 border-2 border-dashed rounded-3xl ${
            activeColor === 'green' ? 'border-green-100 text-green-600' : 'border-blue-100 text-blue-500'
          }`}>
            <p className="text-sm font-semibold">No products found in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
