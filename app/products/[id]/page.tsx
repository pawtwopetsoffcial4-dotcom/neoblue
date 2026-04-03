"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';

type ProductDetailProps = {
  params: Promise<{ id: string }>;
};

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export default function ProductDetailPage({ params }: ProductDetailProps) {
  const [id, setId] = useState('');
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    params.then((data) => setId(data.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${id}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Product not found');
        }

        const data = await response.json();
        setProduct(data.product ?? null);
      } catch {
        setError('Unable to load product details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500 selection:text-white">
      <main className="pt-20 md:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <Link href="/products" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>

        {isLoading && (
          <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-12 text-center">
            <p className="text-lg font-semibold text-slate-900">Loading product...</p>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-12 text-center">
            <p className="text-lg font-semibold text-rose-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && product && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-3xl overflow-hidden border border-blue-100 bg-white">
              <img
                src={product.images?.[0] ?? '/api/placeholder/900/700'}
                alt={product.title}
                className="w-full aspect-[4/3] object-cover"
              />
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-6 md:p-8">
              <p className="text-xs text-blue-700 uppercase tracking-wider mb-2">
                {product.category} • {product.waterType}
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">{product.title}</h1>
              <p className="text-slate-600 italic text-sm mt-2">{product.scientific ?? 'Aquatic premium stock'}</p>

              <p className="mt-6 text-slate-700 leading-relaxed">{product.description}</p>

              <div className="mt-8 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-slate-900">{formatPrice(product.price)}</p>
                  <p className="text-sm text-blue-700">Rating {product.rating.toFixed(1)} / 5</p>
                </div>
                <button
                  onClick={() => product && addToCart(product)}
                  className="h-12 px-6 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to Cart
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
