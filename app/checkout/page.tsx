"use client";

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { Trash2, Plus, Minus, MapPin, ShoppingBag, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isPaying, setIsPaying] = useState(false);
  const [address, setAddress] = useState({ street: '', city: '', state: '', zipcode: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handlePayNow = async () => {
    if (!user || user.role !== 'user') {
      alert('Please login as a customer to place an order.');
      return;
    }

    if (items.length === 0) {
      alert('Cart is empty.');
      return;
    }

    if (!address.street || !address.city || !address.state || !address.zipcode) {
      alert('Please fill delivery address.');
      return;
    }

    try {
      setIsPaying(true);

      const razorpayOrder = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken') ?? ''}`,
        },
        body: JSON.stringify({ amount: totalAmount }),
      }).then((res) => res.json());

      const options = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'NEOBLUE',
        description: 'Aquatic Marketplace Checkout',
        order_id: razorpayOrder.orderId,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#2563eb' },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await apiClient.createOrder({
            products: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
            address,
            paymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
          });

          clearCart();
          router.push('/orders');
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch {
      alert('Payment initialization failed.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24 md:pb-32 font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* Header section */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-8 md:pt-12 md:pb-12 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-medium">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Cart & Checkout</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
            Your Cart
          </h1>
          <p className="text-gray-500 mt-2 font-medium max-w-xl">
            Review your aquatic items and provide your delivery details below to proceed with the secure checkout process.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-10">
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm max-w-2xl mx-auto mt-12">
            <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Looks like you haven't added any premium aquatic life or supplies to your cart yet.
            </p>
            <Link href="/products" className="inline-flex h-12 px-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-sm gap-2">
              Browse Products <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Cart Items ({items.length})</h2>
                  <button onClick={clearCart} className="text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4" /> Clear All
                  </button>
                </div>
                
                <div className="p-6 md:p-8 space-y-6">
                  {items.map((item) => (
                    <article key={item.productId} className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-bold text-lg text-gray-900 leading-tight truncate">{item.title}</h3>
                            <p className="font-bold text-lg text-gray-900 shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 font-medium">₹{item.price.toFixed(2)} / each</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full p-1">
                            <button 
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)} 
                              className="h-8 w-8 rounded-full bg-white text-gray-600 shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                              className="h-8 w-8 rounded-full bg-white text-gray-600 shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(item.productId)} 
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <Link href="/products" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 w-fit gap-2 px-2 py-4">
                <ArrowLeft className="h-4 w-4" /> Continue Shopping
              </Link>
            </div>

            {/* Right Column: Checkout & Address */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-24">
              
              {/* Address Form */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Delivery Details</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Street Address</label>
                    <input 
                      className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900" 
                      placeholder="123 Ocean Avenue, Apt 4B" 
                      value={address.street} 
                      onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                      <input 
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900" 
                        placeholder="Mumbai" 
                        value={address.city} 
                        onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                      <input 
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900" 
                        placeholder="Maharashtra" 
                        value={address.state} 
                        onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zipcode / PIN</label>
                    <input 
                      className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900" 
                      placeholder="400001" 
                      value={address.zipcode} 
                      onChange={(e) => setAddress((prev) => ({ ...prev, zipcode: e.target.value }))} 
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden border-t-4 border-t-blue-600">
                <div className="p-6 md:p-8 space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Order Summary</h2>
                  
                  <div className="space-y-3 font-medium text-gray-600 border-b border-gray-100 pb-6">
                    <div className="flex justify-between items-center">
                      <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} items)</span>
                      <span className="text-gray-900">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center items-end py-2">
                    <span className="text-lg font-bold text-gray-900">Total Price</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-gray-900 block leading-none">₹{totalAmount.toFixed(2)}</span>
                      <span className="text-xs text-gray-500 mt-1 block">Includes Live Arrival protection</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePayNow}
                    disabled={isPaying || items.length === 0}
                    className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 active:scale-[0.98]"
                  >
                    {isPaying ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : (
                      <>Checkout Securely <ArrowRight className="h-5 w-5" /></>
                    )}
                  </button>
                  
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 mt-4 uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" /> 100% SECURE RAZORPAY
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
