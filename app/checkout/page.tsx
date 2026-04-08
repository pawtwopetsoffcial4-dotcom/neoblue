"use client";

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

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
    <div className="min-h-screen bg-white text-slate-900 pt-20 md:pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="mb-8">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-2">Checkout</p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">Your Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section className="rounded-3xl border border-blue-100 bg-white p-5 space-y-4">
          {items.map((item) => (
            <article key={item.productId} className="flex items-center gap-4 border-b border-blue-50 pb-4 last:border-b-0">
              <img src={item.image} alt={item.title} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-bold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">₹{item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="h-8 w-8 rounded-full border border-blue-200">-</button>
                <span className="w-6 text-center font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="h-8 w-8 rounded-full border border-blue-200">+</button>
              </div>
              <button onClick={() => removeFromCart(item.productId)} className="text-xs font-semibold text-rose-600">Remove</button>
            </article>
          ))}

          {items.length === 0 && <p className="text-slate-600">Your cart is empty.</p>}
        </section>

        <aside className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5 h-fit space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Delivery Address</h2>
          <input className="w-full h-11 px-4 rounded-xl border border-blue-200" placeholder="Street" value={address.street} onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))} />
          <input className="w-full h-11 px-4 rounded-xl border border-blue-200" placeholder="City" value={address.city} onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))} />
          <input className="w-full h-11 px-4 rounded-xl border border-blue-200" placeholder="State" value={address.state} onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))} />
          <input className="w-full h-11 px-4 rounded-xl border border-blue-200" placeholder="Zipcode" value={address.zipcode} onChange={(e) => setAddress((prev) => ({ ...prev, zipcode: e.target.value }))} />

          <div className="pt-2 border-t border-blue-200">
            <p className="text-sm text-slate-600">Total</p>
            <p className="text-3xl font-black text-slate-900">₹{totalAmount.toFixed(2)}</p>
          </div>

          <button
            onClick={handlePayNow}
            disabled={isPaying || items.length === 0}
            className="w-full h-12 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60"
          >
            {isPaying ? 'Processing...' : 'Pay with Razorpay'}
          </button>
        </aside>
      </div>
    </div>
  );
}
