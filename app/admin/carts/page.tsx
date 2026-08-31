"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Search, 
  RefreshCw, 
  User, 
  Phone, 
  Mail, 
  ExternalLink, 
  MessageCircle, 
  Calendar, 
  Package, 
  IndianRupee, 
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

type CartItem = {
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  packQty?: number;
  unitLabel?: string;
  category?: string;
  slug?: string;
  itemTotal: number;
};

type CustomerCart = {
  cartId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    joinedAt?: string;
  };
  items: CartItem[];
  totalCartValue: number;
  totalItemsCount: number;
  updatedAt: string;
  createdAt: string;
};

export default function AdminCartsPage() {
  const { token } = useAuth();
  const [carts, setCarts] = useState<CustomerCart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadCarts = async () => {
    try {
      const storedToken = token || localStorage.getItem('authToken') || '';
      const res = await fetch('/api/admin/carts', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to load carts');
      }

      const data = await res.json();
      setCarts(data.carts || []);
    } catch (err) {
      console.error('Error fetching admin carts:', err);
      setCarts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCarts();
  }, [token]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCarts();
  };

  const filteredCarts = useMemo(() => {
    if (!searchTerm.trim()) return carts;
    const term = searchTerm.toLowerCase().trim();

    return carts.filter((cart) => {
      const nameMatch = cart.user.name.toLowerCase().includes(term);
      const emailMatch = cart.user.email.toLowerCase().includes(term);
      const phoneMatch = cart.user.phone.includes(term);
      const productMatch = cart.items.some((item) => item.title.toLowerCase().includes(term));
      return nameMatch || emailMatch || phoneMatch || productMatch;
    });
  }, [carts, searchTerm]);

  const stats = useMemo(() => {
    const totalCarts = carts.length;
    const totalPotentialValue = carts.reduce((sum, c) => sum + c.totalCartValue, 0);
    const totalProducts = carts.reduce((sum, c) => sum + c.totalItemsCount, 0);
    const avgValue = totalCarts > 0 ? Math.round(totalPotentialValue / totalCarts) : 0;

    return { totalCarts, totalPotentialValue, totalProducts, avgValue };
  }, [carts]);

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">
            Real-Time Leads & Intent
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Customer Carts & Added Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Track customer identities and live products added to cart for instant follow-up & recovery.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 font-bold text-xs shadow-2xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Carts</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {stats.totalCarts}
          </p>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">Customers with products</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Cart Value</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            ₹{stats.totalPotentialValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">Potential pipeline revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg. Cart Value</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            ₹{stats.avgValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">Per prospective buyer</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Items</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {stats.totalProducts}
          </p>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">Units in customer bags</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, email, or product added..."
            className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Customer Carts List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm font-bold text-slate-700">Loading customer carts...</p>
        </div>
      ) : filteredCarts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No active customer carts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm ? 'No results matched your search criteria.' : 'When customers add products to their bag, their contact details and selected products will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCarts.map((cart) => {
            const cleanPhone = cart.user.phone.replace(/[^0-9]/g, '').slice(-10);
            const waText = encodeURIComponent(
              `Hi ${cart.user.name}, we noticed you added ${cart.items.map(i => `${i.quantity}x ${i.title} (${i.unitLabel})`).join(', ')} to your NeoBlue cart. Can we help you complete your order?`
            );
            const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${waText}` : '';

            return (
              <div 
                key={cart.cartId}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-all"
              >
                {/* Top Row: Customer Info & Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                      {cart.user.name.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug flex items-center gap-2">
                        {cart.user.name}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {cart.items.length} product{cart.items.length > 1 ? 's' : ''}
                        </span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                        {cart.user.phone && (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            +91 {cart.user.phone}
                          </span>
                        )}
                        {cart.user.email && (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {cart.user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 mr-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatRelativeTime(cart.updatedAt)}</span>
                    </div>

                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {cart.user.phone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Middle Row: Added Products Grid */}
                <div className="py-4 space-y-2.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Products Added to Cart:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {cart.items.map((item, idx) => (
                      <div 
                        key={`${item.productId}-${idx}`}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100/90 hover:border-slate-200 transition-all"
                      >
                        <div className="relative w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-200/80">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-900 truncate leading-snug" title={item.title}>
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                              {item.unitLabel}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              Qty: {item.quantity}
                            </span>
                          </div>
                          <p className="text-xs font-black text-slate-900 mt-0.5">
                            ₹{item.itemTotal.toLocaleString('en-IN')}
                            {item.quantity > 1 && (
                              <span className="text-[10px] font-normal text-slate-400 ml-1">
                                (₹{item.price} ea)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Total & Summary */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Total in Cart: <strong className="text-slate-800 font-bold">{cart.totalItemsCount} item{cart.totalItemsCount > 1 ? 's' : ''}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Potential Order Value:</span>
                    <span className="text-base font-black text-slate-900">
                      ₹{cart.totalCartValue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
