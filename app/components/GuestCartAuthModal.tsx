'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, User, Phone, Mail, ShoppingBag, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import type { PackOptions } from '@/lib/hooks/useCart';

interface GuestCartAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItem: {
    product: MarketplaceProduct;
    quantity: number;
    packOptions?: PackOptions;
  } | null;
  onSuccess: (token: string, user: any) => void;
}

export default function GuestCartAuthModal({
  isOpen,
  onClose,
  pendingItem,
  onSuccess,
}: GuestCartAuthModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !pendingItem) return null;

  const { product, quantity, packOptions } = pendingItem;
  const isPlants = product.category === 'Plants';
  const packQty = packOptions?.packQty || 1;
  const unitLabel = packOptions?.unitLabel || (packQty > 1 ? `Pack of ${packQty}` : (product.perPairPrice != null ? 'pair' : 'piece'));
  const itemPrice = packOptions?.customPrice || (packQty > 1 ? Math.round(product.price * packQty * (packQty === 6 ? 0.90 : packQty === 3 ? 0.95 : 1)) : product.price);
  const totalPrice = itemPrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

    if (!cleanName) {
      setErrorMessage('Please enter your full name');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!cleanEmail || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/cart-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to continue. Please check your details.');
      }

      onSuccess(data.token, data.user);
    } catch (err: any) {
      console.error('Guest cart auth failed:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-blue-50/40">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
              isPlants ? 'bg-emerald-600 shadow-emerald-600/25' : 'bg-blue-600 shadow-blue-600/25'
            }`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Enter Details to Add to Bag
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Save your cart & get instant order updates
              </p>
            </div>
          </div>

          {/* Pending Product Preview */}
          <div className="mt-4 p-3 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-2xs">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
              <Image
                src={product.images?.[0] || '/illustrations/placeholder.png'}
                alt={product.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900 truncate">{product.title}</p>
              <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                {quantity > 1 ? `${quantity}x ` : ''}{unitLabel} • <strong className="text-slate-900">₹{totalPrice.toLocaleString('en-IN')}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold text-center animate-in fade-in duration-200">
              {errorMessage}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sachin Parihar"
                className="w-full h-11 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200/90 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex">
              <span className="inline-flex items-center px-3 text-xs font-bold text-slate-500 bg-slate-100 border border-r-0 border-slate-200/90 rounded-l-xl select-none">
                +91
              </span>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="9876543210"
                  className="w-full h-11 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200/90 rounded-r-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200/90 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-12 rounded-xl text-white font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] cursor-pointer ${
              isPlants 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
            } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Continue & Add to Bag</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Security & Guarantee Tag */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Secure • Live Arrival Guarantee</span>
          </div>
        </form>
      </div>
    </div>
  );
}
