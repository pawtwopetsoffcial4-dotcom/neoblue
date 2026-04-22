"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { CreditCard, MapPin, Package, UserRound, LayoutDashboard, Fish, PlusCircle, PackageCheck, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

type VendorOrder = {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

const vendorNavItems = [
  { href: '/profile', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Products', icon: Fish },
  { href: '/vendor/add-product', label: 'Add Product', icon: PlusCircle },
  { href: '/vendor/orders', label: 'Orders', icon: PackageCheck },
];

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);

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
          setOrders((ordersRes as { orders: VendorOrder[] }).orders ?? []);
        } catch {
          setProducts([]);
          setOrders([]);
        }
      }
    };

    load();
  }, [isAuthenticated, user?.role]);

  // If user is a vendor, show vendor dashboard with sidebar
  if (isAuthenticated && user?.role === 'vendor') {
    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

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
                <p className="text-3xl font-black text-slate-900 mt-2">{orders.length}</p>
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
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // For non-vendors (customers), show regular profile
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500 selection:text-white pb-24 md:pb-0">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-10">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-2">Account</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">My Profile</h1>
        </div>

        <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 md:p-8 mb-7">
          {isAuthenticated && user ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <UserRound className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-slate-600">{user.email}</p>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mt-1">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="h-11 px-5 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-slate-900">You are not logged in</h2>
              <p className="text-slate-600 mt-1">Please sign in to view your profile details.</p>
              <Link
                href="/auth/login"
                className="inline-flex mt-4 h-10 px-5 items-center rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <Package className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Orders</h3>
            <p className="text-slate-600 text-sm mt-1">Track active shipments and view order history.</p>
            <Link href="/orders" className="inline-block mt-4 text-blue-600 font-semibold hover:text-blue-700">View Orders</Link>
          </article>

          <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Addresses</h3>
            <p className="text-slate-600 text-sm mt-1">Manage delivery addresses for livestock shipments.</p>
            <Link href="/products" className="inline-block mt-4 text-blue-600 font-semibold hover:text-blue-700">Manage</Link>
          </article>

          <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Payments</h3>
            <p className="text-slate-600 text-sm mt-1">Save payment methods for fast checkout.</p>
            <Link href="/checkout" className="inline-block mt-4 text-blue-600 font-semibold hover:text-blue-700">Checkout</Link>
          </article>
        </section>
      </main>
    </div>
  );
}
