"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, PackageOpen, Loader2 } from 'lucide-react';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { useCart } from '@/lib/hooks/useCart';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

export default function WishlistPage() {
  const { wishlistIds, removeFromWishlist, isLoaded } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (!isLoaded) return;
      if (wishlistIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch('/api/products?limit=300');
        const data = await res.json();
        const allList: MarketplaceProduct[] = Array.isArray(data) ? data : data.products || [];
        const matched = allList.filter((p) => wishlistIds.includes(p._id));
        setProducts(matched);
      } catch (err) {
        console.error('Error loading wishlist items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlistIds, isLoaded]);

  const handleMoveToBag = (product: MarketplaceProduct) => {
    addToCart(product);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 selection:bg-rose-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-700 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-lg shadow-rose-900/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-2">
              <Heart className="h-3.5 w-3.5 fill-rose-300 text-rose-300" />
              <span>Saved Items</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              My Aquatic Wishlist
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm font-medium mt-1">
              Keep track of your favorite species, plants, and breeders for your next setup.
            </p>
          </div>

          <span className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider border border-white/30">
            {wishlistIds.length} Saved {wishlistIds.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-rose-600 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading your saved items...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200/80 shadow-sm space-y-4 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
              <Heart className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Your Wishlist is Empty</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Explore our live fish, rare discus, planted aquarium species, and shrimp collections to save items you love.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer mt-2"
            >
              <span>Explore Products</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 mb-3">
                    <Link href={`/products/${product._id}`}>
                      <Image
                        src={product.images?.[0] || '/logo.png'}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </Link>

                    {/* Stock status badge */}
                    <span
                      className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        product.inStock
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-rose-600/90 text-white'
                      }`}
                    >
                      {product.inStock ? 'In Stock' : 'Sold Out'}
                    </span>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromWishlist(product._id)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-xs text-slate-500 hover:text-rose-600 hover:bg-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Details */}
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {product.category}
                  </span>
                  <Link href={`/products/${product._id}`}>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mt-0.5 leading-snug">
                      {product.title}
                    </h3>
                  </Link>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-base font-black text-slate-900">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Move to Bag CTA */}
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleMoveToBag(product)}
                    disabled={!product.inStock}
                    className={`w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !product.inStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : addedId === product._id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {addedId === product._id ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{product.inStock ? 'Add to Bag' : 'Out of Stock'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
