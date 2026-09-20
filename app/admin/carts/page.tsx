"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  ShoppingCart, 
  Search, 
  RefreshCw, 
  Phone, 
  Mail, 
  MessageCircle, 
  Package, 
  IndianRupee, 
  TrendingUp,
  Clock,
  Sparkles,
  Send,
  Copy,
  Check,
  X,
  ExternalLink,
  Flame,
  ShieldCheck,
  HelpCircle,
  Link2
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

type RetentionTemplate = {
  id: string;
  title: string;
  badge: string;
  icon: any;
  generateText: (cart: CustomerCart, checkoutUrl: string) => string;
};

const RETENTION_TEMPLATES: RetentionTemplate[] = [
  {
    id: 'reminder_stock',
    title: 'Limited Stock Reservation',
    badge: 'Popular',
    icon: Flame,
    generateText: (cart, url) => {
      const itemsList = cart.items.map(i => `${i.quantity}x ${i.title} (${i.unitLabel || 'pcs'})`).join(', ');
      return `Hi ${cart.user.name || 'there'}! 👋\n\nWe noticed you left ${itemsList} in your NeoBlue aquatic cart (Total: ₹${cart.totalCartValue.toLocaleString('en-IN')}).\n\nAquatic live stocks are limited! Would you like us to reserve and pack your order for today's live express dispatch?\n\n🛒 Complete your checkout here: ${url}\n\nLive Arrival Guarantee included! 🐠✨`;
    },
  },
  {
    id: 'express_care',
    title: 'Priority Packaging & LAG Guarantee',
    badge: 'High Trust',
    icon: ShieldCheck,
    generateText: (cart, url) => {
      const itemsList = cart.items.map(i => `${i.quantity}x ${i.title}`).join(', ');
      return `Hi ${cart.user.name || 'there'}, your selected aquatic varieties (${itemsList}) are ready in our live holding tanks.\n\nComplete your NeoBlue order today and our team will provide priority oxygenated packaging with our 100% Live Arrival Guarantee (LAG).\n\n👉 Fast Checkout: ${url}\n\nLet us know if you need any help!`;
    },
  },
  {
    id: 'expert_help',
    title: 'Water Care & Tank Setup Assistance',
    badge: 'Support',
    icon: HelpCircle,
    generateText: (cart, url) => {
      const itemsList = cart.items.map(i => i.title).join(', ');
      return `Hi ${cart.user.name || 'there'}, this is from NeoBlue Aquatic Care team.\n\nWe noticed you're interested in ${itemsList}. Do you have any questions regarding water parameters (pH, temperature, hardness), tank mates, or acclimation before placing your order?\n\nWe're here to help! When ready, you can checkout here: ${url}`;
    },
  },
  {
    id: 'quick_followup',
    title: 'Quick Checkout Assistance',
    badge: 'Direct',
    icon: Sparkles,
    generateText: (cart, url) => {
      return `Hi ${cart.user.name || 'there'}, did you face any payment or delivery issues while checking out your NeoBlue cart (₹${cart.totalCartValue.toLocaleString('en-IN')})?\n\nReply to this message and we will assist you immediately, or complete your order here: ${url}`;
    },
  },
];

export default function AdminCartsPage() {
  const { token } = useAuth();
  const [carts, setCarts] = useState<CustomerCart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Retaining Modal State
  const [activeRetainingCart, setActiveRetainingCart] = useState<CustomerCart | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('reminder_stock');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const openRetainingModal = (cart: CustomerCart) => {
    setActiveRetainingCart(cart);
    setSelectedTemplateId('reminder_stock');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://neoblue.in';
    const checkoutUrl = `${baseUrl}/cart`;
    const template = RETENTION_TEMPLATES.find(t => t.id === 'reminder_stock') || RETENTION_TEMPLATES[0];
    setCustomMessage(template.generateText(cart, checkoutUrl));
  };

  const handleSelectTemplate = (templateId: string) => {
    if (!activeRetainingCart) return;
    setSelectedTemplateId(templateId);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://neoblue.in';
    const checkoutUrl = `${baseUrl}/cart`;
    const template = RETENTION_TEMPLATES.find(t => t.id === templateId) || RETENTION_TEMPLATES[0];
    setCustomMessage(template.generateText(activeRetainingCart, checkoutUrl));
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">
            Real-Time Leads &amp; Recovery
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Abandoned Carts &amp; Retaining Station
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Employees and administrators can track customer carts and issue instant retaining messages via WhatsApp and Email.
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
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">Prospective buyers</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recoverable Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            ₹{stats.totalPotentialValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">Potential pipeline</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg. Cart Value</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            ₹{stats.avgValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">Per abandoned bag</p>
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
            className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
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
            {searchTerm ? 'No results matched your search criteria.' : 'When customers add products to their bag, their contact details and selected products will appear here for follow-up.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCarts.map((cart) => {
            const cleanPhone = cart.user.phone.replace(/[^0-9]/g, '').slice(-10);

            return (
              <div 
                key={cart.cartId}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all"
              >
                {/* Top Row: Customer Info & Timestamp */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                      {cart.user.name.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug flex items-center gap-2 flex-wrap">
                        {cart.user.name}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {cart.items.length} variety{cart.items.length > 1 ? 'ies' : ''} ({cart.totalItemsCount} items)
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
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(cart.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openRetainingModal(cart)}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors shadow-2xs cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Send Retaining Message</span>
                    </button>

                    {cleanPhone && (
                      <a
                        href={`https://wa.me/91${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {cart.user.phone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex items-center gap-1 h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
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

      {/* ── Retaining & Recovery Modal ── */}
      {activeRetainingCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 fill-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Send Retaining Message
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customer: <strong className="text-slate-800">{activeRetainingCart.user.name}</strong> • ₹{activeRetainingCart.totalCartValue.toLocaleString('en-IN')} Cart Value
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRetainingCart(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Template Selectors */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  1. Choose Retention Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RETENTION_TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <button
                        type="button"
                        key={tmpl.id}
                        onClick={() => handleSelectTemplate(tmpl.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-2xs'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {tmpl.badge}
                          </span>
                        </div>
                        <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                          {tmpl.title}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Content Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    2. Customize Message Content
                  </label>
                  <button
                    onClick={() => handleCopy(customMessage, 'msg-modal')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    {copiedKey === 'msg-modal' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" /> Copied Text
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Message
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 leading-relaxed outline-none focus:bg-white focus:border-blue-500 transition-all resize-y"
                  placeholder="Type or customize your message here..."
                />
              </div>

              {/* Customer Direct Contact Info */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">Phone: {activeRetainingCart.user.phone || 'N/A'}</span>
                  {activeRetainingCart.user.email && (
                    <span className="text-slate-500">• {activeRetainingCart.user.email}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://neoblue.in';
                    handleCopy(`${baseUrl}/cart`, 'cart-link');
                  }}
                  className="inline-flex items-center gap-1 font-bold text-[11px] text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {copiedKey === 'cart-link' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied Checkout Link
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3" /> Copy Checkout URL
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveRetainingCart(null)}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {activeRetainingCart.user.email && (
                  <a
                    href={`mailto:${activeRetainingCart.user.email}?subject=${encodeURIComponent('Special Offer on your NeoBlue Aquatic Cart')}&body=${encodeURIComponent(customMessage)}`}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send via Email</span>
                  </a>
                )}

                {(() => {
                  const cleanPhone = activeRetainingCart.user.phone.replace(/[^0-9]/g, '').slice(-10);
                  const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(customMessage)}` : '';

                  return waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-2xs cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Send on WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold"
                    >
                      No Phone Number
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

