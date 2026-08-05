"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, MapPin, Package, UserRound, LayoutDashboard, Fish, PlusCircle, PackageCheck, LogOut, Shield, ChevronRight, Phone, Mail, ShoppingBag, ArrowUpRight, Clock, Loader2, Truck, CheckCircle2, XCircle, Star, Bell, DollarSign, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { apiClient } from '@/lib/api-client';

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

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, bg: string, border: string }> = {
  placed: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  accepted: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  preparing: { icon: Package, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  completed: { icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  cancelled: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
};

const customerQuickLinks = [
  { href: '/orders', label: 'My Orders', desc: 'Track & manage orders', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  { href: '/profile/addresses', label: 'Addresses', desc: 'Manage delivery locations', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { href: '/profile?tab=notifications', label: 'Notifications', desc: 'View order alerts & updates', icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50' },
  { href: '/checkout', label: 'Checkout', desc: 'Complete a purchase', icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50' },
  { href: '/products', label: 'Browse Products', desc: 'Explore our collection', icon: Fish, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const vendorQuickLinks = [
  { href: '/vendor/dashboard', label: 'Vendor Dashboard', desc: 'Overview & analytics', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50' },
  { href: '/vendor/products', label: 'My Products', desc: 'Manage your catalog', icon: Fish, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { href: '/vendor/add-product', label: 'Add Product', desc: 'List a new product', icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { href: '/vendor/orders', label: 'Vendor Orders', desc: 'Manage customer orders', icon: PackageCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
  { href: '/profile?tab=notifications', label: 'Notifications', desc: 'Track sales, order updates & claims', icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50' },
  { href: '/vendor/claims', label: 'DOA Claims', desc: 'Handle arrival claims', icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
  { href: '/profile/addresses', label: 'Addresses', desc: 'Manage delivery locations', icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-50' },
];

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

function ProfilePageContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const {
    notifications,
    markAllAsRead: markAllReadOnProfile,
    markAsRead: markAsReadHook,
    clearAll: clearAllOnProfile,
    fetchNotifications: fetchProfileNotifications,
  } = useNotifications();

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchProfileNotifications();
    }
  }, [activeTab]);

  const markSingleRead = async (id: string, link?: string) => {
    await markAsReadHook(id);
    if (link) {
      router.push(link);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Load profile data for all authenticated users
  const loadProfileData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [ordersRes, addressRes] = await Promise.all([
        apiClient.getOrders().catch(() => ({ orders: [] })),
        apiClient.request<{ addresses?: Address[]; phone?: string }>('/profile/address').catch(() => ({ addresses: [], phone: '' })),
      ]);
      setOrders((ordersRes as { orders: UserOrder[] }).orders ?? []);
      setAddresses(addressRes.addresses ?? []);
      setPhone(addressRes.phone ?? '');
    } catch {
      setOrders([]);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // ─── Computed data ─────────────────────────────────────────────────
  const totalSpent = orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'pending')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const activeOrders = orders.filter(o => !['completed', 'cancelled', 'pending'].includes(o.status)).length;
  const recentOrders = orders.slice(0, 3);
  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;
  const isVendor = user?.role === 'vendor';
  const quickLinks = isVendor ? vendorQuickLinks : customerQuickLinks;

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
            <section className="rounded-3xl bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 md:p-8 mb-6 relative overflow-hidden text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)]">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/15 backdrop-blur-sm text-white flex items-center justify-center ring-1 ring-white/20">
                    <span className="text-2xl md:text-3xl font-black">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">{user.name}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1.5">
                      <span className="text-blue-100 text-sm flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {user.email}
                      </span>
                      {phone && (
                        <span className="text-blue-100 text-sm flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider">
                        <Star className="h-3 w-3 fill-current" /> {user.role === 'admin' ? 'Admin' : isVendor ? 'Vendor' : 'Customer'}
                      </span>
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
                  <AnimatedCounter target={orders.length} />
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

              {activeTab === 'notifications' ? (
                /* ── Notifications View ── */
                <section className="rounded-3xl border border-blue-100 bg-white shadow-sm overflow-hidden p-5 md:p-6 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Bell className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-900 font-extrabold">Notifications</h3>
                        <p className="text-xs text-slate-400">Keep track of order updates and claims</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notifications.some(n => !n.read) && (
                        <button
                          type="button"
                          onClick={markAllReadOnProfile}
                          className="text-xs font-bold text-blue-600 hover:text-blue-750 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllOnProfile}
                          className="text-xs font-bold text-rose-600 hover:text-rose-750 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <div className="py-16 text-center text-slate-400">
                        <Bell className="h-10 w-10 text-slate-300 stroke-[1.5] mb-2 mx-auto" />
                        <p className="text-xs font-semibold">No notifications yet</p>
                        <p className="text-[10px] mt-0.5">We will let you know when things happen.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => markSingleRead(n._id, n.link)}
                          className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                            !n.read
                              ? 'bg-slate-50 border-blue-100/70 hover:bg-slate-100'
                              : 'bg-white border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${
                            n.type === 'new_order' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            n.type === 'order_status' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            n.type === 'claim' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>
                            {n.type === 'new_order' ? <DollarSign className="w-4 h-4" /> :
                             n.type === 'order_status' ? <Package className="w-4 h-4" /> :
                             n.type === 'claim' ? '⚠️' : <Bell className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs ${!n.read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                {n.title}
                              </p>
                              {!n.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                              {n.message}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1.5">
                              {new Date(n.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              ) : (
                /* ── Recent Orders ── */
                <section className="rounded-3xl border border-blue-100 bg-white shadow-sm overflow-hidden">
                  <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-900">Recent Orders</h3>
                        <p className="text-xs text-slate-400">Your latest {isVendor ? 'vendor' : ''} orders</p>
                      </div>
                    </div>
                    <Link href={isVendor ? '/vendor/orders' : '/orders'} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                      View All <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                      <p className="font-bold text-slate-700 mb-1">No orders yet</p>
                      <p className="text-sm text-slate-400 mb-6">
                        {isVendor ? 'Orders from customers will appear here' : 'Browse our collection and find something you love'}
                      </p>
                      <Link href={isVendor ? '/vendor/dashboard' : '/products'} className="h-10 px-6 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                        {isVendor ? 'Go to Dashboard' : 'Shop Now'} <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {recentOrders.map((order) => {
                        const config = statusConfig[order.status] || statusConfig.placed;
                        const StatusIcon = config.icon;
                        const itemCount = order.products.reduce((s, p) => s + p.quantity, 0);
                        return (
                          <Link key={order._id} href={isVendor ? '/vendor/orders' : '/orders'} className="flex items-center gap-4 p-5 md:p-6 hover:bg-slate-50/50 transition-colors group cursor-pointer">
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
              )}

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

                  {isLoading ? (
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
                    {quickLinks.map((link) => {
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
                href={isVendor ? '/vendor/claims' : '/orders'}
                className="h-10 px-5 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                {isVendor ? 'Manage Claims' : 'View Claims'} <ChevronRight className="h-4 w-4" />
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
