"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Star, Truck, Shield, Droplets, Thermometer, Info, MessageSquare, ChevronRight, Heart, Share2 } from 'lucide-react';
import ReviewList from '@/app/components/ReviewList';
import ReviewForm from '@/app/components/ReviewForm';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';

type ProductDetailProps = {
  params: Promise<{ id: string }>;
};

const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

export default function ProductDetailPage({ params }: ProductDetailProps) {
  const [id, setId] = useState('');
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'faq' | 'reviews'>('description');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    params.then((data) => setId(data.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    setActiveImageIndex(0);

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

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/reviews/${id}`, { cache: 'no-store' });
        if (!res.ok) return;
        const body = await res.json();
        if (mounted) setReviews(Array.isArray(body.reviews) ? body.reviews : []);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
         <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Oops! Product not found</h2>
             <p className="text-slate-500 mb-6">{error || "We couldn't find the product you're looking for."}</p>
             <Link href="/products" className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors w-full">
               Return to Shop
             </Link>
         </div>
      </div>
    );
  }

  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'];
  const activeImage = productImages[Math.min(activeImageIndex, productImages.length - 1)];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 selection:bg-blue-100 pb-24 md:pb-12">
      {/* Navigation / Breadcrumb */}
      <nav className="sticky top-0 z-40 bg-[#F5F7FA]/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/products" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
          <div className="flex items-center gap-3">
             <button className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">
                <Heart className="h-4 w-4" />
             </button>
             <button className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                <Share2 className="h-4 w-4" />
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Section - Image & Core Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Image Gallery */}
           <div className="lg:col-span-7 -mx-4 sm:mx-0 flex flex-col gap-4">
             <div className="relative aspect-square w-full rounded-none sm:rounded-3xl bg-slate-900 sm:border sm:border-slate-100 sm:shadow-sm overflow-hidden group">
                 <img
                src={activeImage}
                  alt={product.title}
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
                 <div className="absolute top-6 left-6 flex flex-col gap-2">
                    {product.tag && (
                      <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider pill-neoblue-gradient text-white shadow-sm w-fit">
                        {product.tag}
                      </span>
                    )}
                    {!product.inStock && (
                       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500 text-white shadow-sm w-fit">
                        Out of Stock
                      </span>
                    )}
                 </div>
             </div>
             {/* Thumbnail placeholders */}
             <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {productImages.map((image, i) => (
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex(i)}
                    key={`${image}-${i}`}
                    className={`shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white border cursor-pointer overflow-hidden ${i === activeImageIndex ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300'} transition-all`}
                  >
                      <img src={image} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
             </div>
          </div>

          {/* Product Info Setup */}
          <div className="lg:col-span-5 flex flex-col">
              <div className="mb-6">
                 <p className="text-sm text-slate-500 mb-3">{product.category} • {product.waterType}</p>
                 <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-2">{product.title}</h1>
                 <p className="text-lg text-slate-500 italic font-serif flex items-center gap-2">
                   {product.scientific ?? 'Premium Aquatic Specimen'}
                 </p>
                 <p className="mt-4 text-sm md:text-base text-slate-600 leading-relaxed line-clamp-4">
                   {product.description || 'Healthy, quarantine-tested livestock sourced for stable acclimation and long-term tank vitality.'}
                 </p>
                 
                 {/* Ratings */}
                 <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-5 w-5 ${star <= Math.round(product.rating) ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-slate-600">{product.rating.toFixed(1)} Rating</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-sm text-blue-600 font-medium hover:underline cursor-pointer">128 Reviews</span>
                 </div>
              </div>

              {/* Price & Cart Actions */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
                 <div className="flex items-start gap-3 mb-6">
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Pricing</p>
                      <p className="text-4xl font-black text-slate-900 leading-none">{formatPrice(product.price)}</p>
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        {typeof product.perPairPrice === 'number' ? (
                          <span>
                            <span className="font-semibold text-slate-900">{formatPrice(product.perPairPrice)}</span> per pair
                          </span>
                        ) : typeof product.perPiecePrice === 'number' ? (
                          <span>
                            <span className="font-semibold text-slate-900">{formatPrice(product.perPiecePrice)}</span> per piece
                          </span>
                        ) : (
                          <span className="text-slate-400">Unit pricing will appear here when available.</span>
                        )}
                        <span>
                          <span className="font-semibold text-slate-900">{formatPrice(Number(product.shippingCharge || 0))}</span>{' '}
                          {product.shippingType === 'weight' ? 'shipping by weight' : 'shipping per piece'}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-medium text-slate-400 line-through mb-1">{formatPrice(product.price * 1.25)}</p>
                    <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                      Save 20%
                    </span>
                 </div>

                 <div className="flex items-center gap-4 mb-6">
                   <div className="flex items-center bg-[#F5F7FA] rounded-2xl p-1 border border-slate-200">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-slate-600 transition-colors shadow-sm"
                      >-</button>
                      <span className="w-12 text-center font-bold text-slate-900">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-slate-600 transition-colors shadow-sm"
                      >+</button>
                   </div>
                   <button
                    onClick={() => {
                        for(let i=0; i<quantity; i++) product && addToCart(product);
                    }}
                    disabled={!product.inStock}
                    className={`flex-1 h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                      ${product.inStock 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/25 active:scale-[0.98]' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                   >
                     <ShoppingBag className="h-5 w-5" /> 
                     {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                   </button>
                 </div>

                 {/* Trust Badges */}
                 <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                         <Truck className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-900">Live Delivery</span>
                         <span className="text-[10px] text-slate-500">100% Guarantee</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                         <Shield className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-900">Quality Checked</span>
                         <span className="text-[10px] text-slate-500">Quarantined</span>
                       </div>
                    </div>
                 </div>
              </div>
          </div>
        </div>

        {/* Bottom Section - Detailed Info */}
        <div className="mt-12 md:mt-20">
           {/* Custom Tabs */}
           <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-slate-200">
              {[
                { id: 'description', icon: Info, label: 'Description' },
                { id: 'specifications', icon: Thermometer, label: 'Care & Specs' },
                { id: 'faq', icon: MessageSquare, label: 'FAQ' },
                { id: 'reviews', icon: MessageSquare, label: 'Reviews (128)' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap
                    ${activeTab === tab.id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                >
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              ))}
           </div>

           {/* Tab Content */}
           <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 min-h-100">
              {activeTab === 'description' && (
                <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h3 className="text-2xl font-bold text-slate-900 mb-6">About this {product.title}</h3>
                   <div className="prose prose-slate prose-lg">
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                      
                      <h4 className="text-xl font-bold text-slate-900 mt-10 mb-4">Why choose Neoblue?</h4>
                      <ul className="space-y-3 mt-4">
                        {[
                          "All livestock undergoes a strict quarantine period before sale.",
                          "We ensure optimal water parameters and nutrition.",
                          "Expert advice available post-purchase to ensure a healthy transition."
                        ].map((item, idx) => (
                           <li key={idx} className="flex items-start gap-3 text-slate-600">
                             <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                             </div>
                             {item}
                           </li>
                        ))}
                      </ul>
                   </div>
                </div>
              )}

              {activeTab === 'specifications' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-2xl font-bold text-slate-900 mb-8">Care Requirements & Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {[
                       { title: "Water Type", value: product.waterType, icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" },
                       { title: "Temperature", value: "24°C - 28°C", icon: Thermometer, color: "text-rose-500", bg: "bg-rose-50" },
                       { title: "Category", value: product.category, icon: Info, color: "text-indigo-500", bg: "bg-indigo-50" },
                     ].map((spec, i) => (
                       <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-[#F5F7FA] hover:border-slate-200 transition-colors">
                          <div className={`w-12 h-12 rounded-xl ${spec.bg} flex items-center justify-center shrink-0`}>
                            <spec.icon className={`h-6 w-6 ${spec.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">{spec.title}</p>
                            <p className="text-base font-bold text-slate-900 uppercase tracking-wide">{spec.value}</p>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
                      <div className="flex items-center gap-6">
                         <div className="flex flex-col items-center justify-center w-24 h-24 bg-[#F5F7FA] rounded-3xl border border-slate-100">
                            <span className="text-3xl font-black text-slate-900">{product.rating.toFixed(1)}</span>
                            <div className="flex text-amber-400 mt-1">
                              <Star className="h-3 w-3 fill-current" />
                              <Star className="h-3 w-3 fill-current" />
                              <Star className="h-3 w-3 fill-current" />
                              <Star className="h-3 w-3 fill-current" />
                              <Star className="h-3 w-3 fill-current" />
                            </div>
                         </div>
                         <div>
                           <h3 className="text-2xl font-bold text-slate-900 mb-1">Customer Reviews</h3>
                           <p className="text-slate-500">Based on 128 certified purchases</p>
                         </div>
                      </div>
                      <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors">
                        Write a Review
                      </button>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Customer Reviews</h3>
                          <p className="text-slate-500 text-sm">Based on {reviews.length} reviews</p>
                        </div>
                        <div>
                          <button onClick={() => setShowForm((s) => !s)} className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition-colors">
                            {showForm ? 'Close' : 'Write a Review'}
                          </button>
                        </div>
                      </div>

                      {showForm && (
                        <div className="p-4 bg-[#fbfdff] rounded-2xl border border-slate-100">
                          <ReviewForm productId={id} onSubmit={() => {
                            // refetch reviews
                            (async () => {
                              try {
                                const res = await fetch(`/api/reviews/${id}`, { cache: 'no-store' });
                                if (!res.ok) return;
                                const body = await res.json();
                                setReviews(Array.isArray(body.reviews) ? body.reviews : []);
                                setShowForm(false);
                              } catch {
                                // ignore
                              }
                            })();
                          }} />
                        </div>
                      )}

                      <ReviewList reviews={reviews} />
                   </div>
                   
                   <button className="mt-8 w-full py-4 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                     Load More Reviews <ChevronRight className="h-4 w-4" />
                   </button>
                 </div>
              )}

              {activeTab === 'faq' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                  <h3 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    {[
                      {
                        q: 'How should I acclimate this fish after delivery?',
                        a: 'Float the bag for 20 to 30 minutes to equalize temperature, then drip acclimate gradually before introducing into your tank.',
                      },
                      {
                        q: 'What tank conditions are recommended?',
                        a: `Maintain stable ${product.waterType.toLowerCase()} parameters, avoid sudden pH/temperature shifts, and provide proper filtration and oxygenation.`,
                      },
                      {
                        q: 'Is this suitable for community tanks?',
                        a: 'Compatibility depends on temperament and size. Match tank mates by behavior, adult size, and water requirements.',
                      },
                      {
                        q: 'What if the fish arrives stressed?',
                        a: 'Keep lights low for the first few hours, reduce handling, and monitor breathing/activity. Contact support promptly if recovery is delayed.',
                      },
                    ].map((item) => (
                      <details
                        key={item.q}
                        className="group rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 open:bg-white open:border-blue-200"
                      >
                        <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                          <span className="font-semibold text-slate-900">{item.q}</span>
                          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                        </summary>
                        <p className="pt-3 text-sm leading-6 text-slate-600">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}
