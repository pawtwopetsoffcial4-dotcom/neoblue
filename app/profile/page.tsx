"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  CreditCard, MapPin, Package, UserRound, LayoutDashboard, Fish,
  PlusCircle, PackageCheck, LogOut, Shield, ChevronRight, Phone,
  Mail, Calendar, ShoppingBag, ArrowUpRight, Clock, Loader2,
  Truck, CheckCircle2, XCircle, Star
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

type VendorOrder = {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

type UserOrder = {
  _id: string;
  totalAmount: number;
  shippingAmount?: number;
  status: 'pending' | 'placed' | 'accepted' | 'preparing' | 'completed' | 'cancelled';
  createdAt: string;
  products: Array<{
    productId: {
      _id: string;
      title: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
};

type Address = {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  isDefault?: boolean;
};

const vendorNavItems = [
  { href: '/profile', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Products', icon: Fish },
  { href: '/vendor/add-product', label: 'Add Product', icon: PlusCircle },
  { href: '/vendor/orders', label: 'Orders', icon: PackageCheck },
  { href: '/vendor/claims', label: 'DOA Claims', icon: Shield },
];

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, bg: string, border: string }> = {
  placed: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  accepted: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  preparing: { icon: Package, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  completed: { icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  cancelled: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
};

function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 800;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);

  return <span>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);

  // Customer-specific state
  const [customerOrders, setCustomerOrders] = useState<UserOrder[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [phone, setPhone] = useState('');
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Load vendor dashboard data if user is a vendor
  useEffect(() => {
    const load = async () => {
      if (isAuthenticated && user?.role === 'vendor') {
        try {
          const [productsRes, ordersRes] = await Promise.all([
            apiClient.getProducts(),
            apiClient.getOrders(),
          ]);
          setProducts((productsRes as { products: MarketplaceProduct[] }).products ?? []);
          setVendorOrders((ordersRes as { orders: VendorOrder[] }).orders ?? []);
        } catch {
          setProducts([]);
          setVendorOrders([]);
        }
      }
    };

    load();
  }, [isAuthenticated, user?.role]);

  // Load customer data (orders + addresses + phone)
  const loadCustomerData = useCallback(async () => {
    if (!isAuthenticated || user?.role === 'vendor') return;
    setIsLoadingCustomer(true);
    try {
      const [ordersRes, addressRes] = await Promise.all([
        apiClient.getOrders().catch(() => ({ orders: [] })),
        apiClient.request<{ addresses?: Address[]; phone?: string }>('/profile/address').catch(() => ({ addresses: [], phone: '' })),
      ]);
      setCustomerOrders((ordersRes as { orders: UserOrder[] }).orders ?? []);
      setAddresses(addressRes.addresses ?? []);
      setPhone(addressRes.phone ?? '');
    } catch {
      setCustomerOrders([]);
      setAddresses([]);
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  // If user is a vendor, show vendor dashboard with sidebar
  if (isAuthenticated && user?.role === 'vendor') {
    const revenue = vendorOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          <aside className="rounded-3xl bg-white border border-blue-100 p-4 md:p-5 h-fit shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">Vendor Panel</p>
            <nav className="space-y-2">
              {vendorNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </aside>

          <section>
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Vendor</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Dashboard</h1>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 md:p-8 mb-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <UserRound className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-slate-600">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl bg-white border border-blue-100 p-5 shadow-sm">
                <p className="text-sm text-slate-500 font-semibold">Products Listed</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{products.length}</p>
              </div>
              <div className="rounded-2xl bg-white border border-blue-100 p-5 shadow-sm">
                <p className="text-sm text-slate-500 font-semibold">Total Orders</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{vendorOrders.length}</p>
              </div>
              <div className="rounded-2xl bg-white border border-blue-100 p-5 shadow-sm">
                <p className="text-sm text-slate-500 font-semibold">Total Revenue</p>
                <p className="text-3xl font-black text-slate-900 mt-2">₹{revenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-blue-100 p-6 shadow-sm">
              <p className="font-bold text-lg text-slate-900 mb-4">Quick Actions</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/vendor/add-product" className="h-11 px-6 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors inline-flex items-center">
                  Add New Product
                </Link>
                <Link href="/vendor/products" className="h-11 px-6 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-colors inline-flex items-center">
                  Manage Products
                </Link>
                <Link href="/vendor/orders" className="h-11 px-6 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-colors inline-flex items-center">
                  View Orders
                </Link>
                <Link href="/vendor/claims" className="h-11 px-6 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-colors inline-flex items-center">
                  Manage DOA Claims
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ─── Customer Profile ──────────────────────────────────────────────
  const totalSpent = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrders = customerOrders.filter(o => o.status === 'completed').length;
  const activeOrders = customerOrders.filter(o => !['completed', 'cancelled', 'pending'].includes(o.status)).length;
  const recentOrders = customerOrders.slice(0, 3);
  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;
  const memberSince = user ? 'Member' : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white pb-28 md:pb-10">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-10">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-2">Account</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">My Profile</h1>
        </div>

        {!isAuthenticated || !user ? (
          /* ── Unauthenticated State ── */
          <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-8 md:p-12 text-center">
            <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-400 flex items-center justify-center mx-auto mb-6">
              <UserRound className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">You&apos;re not logged in</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">Sign in to access your orders, manage delivery addresses, and keep track of your aquatic purchases.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/login"
                className="h-12 px-8 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 inline-flex items-center gap-2"
              >
                Sign In <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/signup"
                className="h-12 px-8 rounded-full border-2 border-blue-200 text-blue-700 font-bold hover:bg-blue-50 transition-colors inline-flex items-center"
              >
                Create Account
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* ── Profile Hero Card ── */}
            <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 md:p-8 mb-6 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
              <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/[0.03]" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/15 backdrop-blur-sm text-white flex items-center justify-center ring-2 ring-white/20 shadow-lg">
                    <span className="text-2xl md:text-3xl font-black">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">{user.name}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1.5">
                      <span className="text-blue-200 text-sm flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {user.email}
                      </span>
                      {phone && (
                        <span className="text-blue-200 text-sm flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider">
                        <Star className="h-3 w-3 fill-current" /> {user.role === 'admin' ? 'Admin' : 'Customer'}
                      </span>
                      <span className="text-blue-300/70 text-xs">{memberSince}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="h-11 px-6 rounded-full bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/20 transition-all border border-white/15 inline-flex items-center gap-2 w-fit"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </section>

            {/* ── Stats Cards ── */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Package className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
                  <AnimatedCounter target={customerOrders.length} />
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
                  <AnimatedCounter target={completedOrders} />
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Truck className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
                  <AnimatedCounter target={activeOrders} />
                </p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Spent</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
                  <AnimatedCounter target={totalSpent} prefix="₹" />
                </p>
              </div>
            </section>

            {/* ── Main Grid: Orders + Sidebar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

              {/* ── Recent Orders ── */}
              <section className="rounded-3xl border border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900">Recent Orders</h3>
                      <p className="text-xs text-slate-400">Your latest purchases</p>
                    </div>
                  </div>
                  <Link href="/orders" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                {isLoadingCustomer ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-slate-700 mb-1">No orders yet</p>
                    <p className="text-sm text-slate-400 mb-6">Browse our collection and find something you love</p>
                    <Link href="/products" className="h-10 px-6 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                      Shop Now <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentOrders.map((order) => {
                      const config = statusConfig[order.status] || statusConfig.placed;
                      const StatusIcon = config.icon;
                      const itemCount = order.products.reduce((s, p) => s + p.quantity, 0);
                      return (
                        <Link key={order._id} href="/orders" className="flex items-center gap-4 p-5 md:p-6 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                          <div className={`h-11 w-11 rounded-xl ${config.bg} ${config.color} flex items-center justify-center shrink-0`}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-sm text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${config.bg} ${config.color} ${config.border} border`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {itemCount} item{itemCount !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors ml-auto mt-1" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── Sidebar ── */}
              <div className="space-y-5">

                {/* Delivery Address */}
                <section className="rounded-3xl border border-blue-100 bg-white p-5 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <h3 className="font-black text-slate-900">Delivery Address</h3>
                    </div>
                    <Link href="/profile/addresses" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      Manage
                    </Link>
                  </div>

                  {isLoadingCustomer ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    </div>
                  ) : defaultAddress ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      {defaultAddress.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-100 mb-2">
                          <CheckCircle2 className="h-3 w-3" /> Default
                        </span>
                      )}
                      <p className="text-sm font-semibold text-slate-900">{defaultAddress.street}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {defaultAddress.city}, {defaultAddress.state} — {defaultAddress.zipcode}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-400 mb-3">No address saved yet</p>
                      <Link
                        href="/profile/addresses"
                        className="h-9 px-5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Add Address
                      </Link>
                    </div>
                  )}

                  {addresses.length > 1 && (
                    <p className="text-xs text-slate-400 mt-3 text-center">
                      +{addresses.length - 1} more address{addresses.length - 1 > 1 ? 'es' : ''} saved
                    </p>
                  )}
                </section>

                {/* Account Details */}
                <section className="rounded-3xl border border-blue-100 bg-white p-5 md:p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <h3 className="font-black text-slate-900">Account Details</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {phone || <span className="text-slate-300 italic">Not added</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60">
                      <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
                        <p className="text-sm font-semibold text-slate-900 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Quick Links */}
                <section className="rounded-3xl border border-blue-100 bg-white shadow-sm overflow-hidden">
                  <div className="p-5 md:p-6 pb-3">
                    <h3 className="font-black text-slate-900 mb-1">Quick Links</h3>
                    <p className="text-xs text-slate-400">Shortcuts to common actions</p>
                  </div>
                  <nav className="divide-y divide-slate-50">
                    {[
                      { href: '/orders', label: 'My Orders', desc: 'Track & manage orders', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { href: '/profile/addresses', label: 'Addresses', desc: 'Manage delivery locations', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { href: '/checkout', label: 'Checkout', desc: 'Complete a purchase', icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50' },
                      { href: '/products', label: 'Browse Products', desc: 'Explore our collection', icon: Fish, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((link) => {
                      const LinkIcon = link.icon;
                      return (
                        <Link key={link.href} href={link.href} className="flex items-center gap-3 px-5 md:px-6 py-3.5 hover:bg-slate-50/80 transition-colors group">
                          <div className={`h-9 w-9 rounded-xl ${link.bg} ${link.color} flex items-center justify-center shrink-0`}>
                            <LinkIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900">{link.label}</p>
                            <p className="text-[11px] text-slate-400">{link.desc}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                        </Link>
                      );
                    })}
                  </nav>
                </section>

              </div>
            </div>

            {/* ── LAG Guarantee Banner ── */}
            <section className="mt-6 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/50 p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Shield className="h-7 w-7" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-black text-lg text-slate-900">Live Arrival Guarantee</h3>
                <p className="text-sm text-slate-500 mt-0.5">Every order is protected. If any livestock arrives DOA, submit a claim with proof within 6 hours for a full refund or replacement.</p>
              </div>
              <Link
                href="/orders"
                className="h-10 px-5 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                View Claims <ChevronRight className="h-4 w-4" />
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
