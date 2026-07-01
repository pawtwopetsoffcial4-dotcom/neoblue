"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Fish, PackageCheck, PlusCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useAuth } from '@/lib/hooks/useAuth';

type VendorOrder = {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

export default function VendorDashboardPage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          apiClient.getProducts({ vendorId: user.id }),
          apiClient.getOrders(),
        ]);
        setProducts((productsRes as { products: MarketplaceProduct[] }).products ?? []);
        setOrders((ordersRes as { orders: VendorOrder[] }).orders ?? []);
      } catch {
        setProducts([]);
        setOrders([]);
      }
    };

    load();
  }, [user?.id]);

  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100">Overview</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Vendor Dashboard</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
              Monitor inventory, track orders, and keep your storefront moving without digging through cramped panels.
            </p>
          </div>

          <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
            <div className="grid grid-cols-2 gap-3 text-sm text-blue-50">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-100">Products</p>
                <p className="mt-2 text-2xl font-black text-white">{products.length}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-100">Orders</p>
                <p className="mt-2 text-2xl font-black text-white">{orders.length}</p>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-100">Revenue</p>
              <p className="mt-1 text-2xl font-black text-white">₹{revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Inventory</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{products.length}</p>
            </div>
            <Fish className="h-10 w-10 text-blue-600" />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">Active products in your catalog.</p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Orders</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{orders.length}</p>
            </div>
            <PackageCheck className="h-10 w-10 text-blue-600" />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">Customer orders waiting for action.</p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Revenue</p>
              <p className="mt-2 text-3xl font-black text-slate-900">₹{revenue.toFixed(2)}</p>
            </div>
            <Sparkles className="h-10 w-10 text-blue-600" />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">Gross value from your order flow.</p>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-blue-100 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Quick Actions</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Move faster from here.</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/vendor/add-product" className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              <PlusCircle className="h-4 w-4" /> Add New Product
            </Link>
            <Link href="/vendor/products" className="inline-flex h-11 items-center gap-2 rounded-full border border-blue-200 px-5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50">
              <ShoppingBag className="h-4 w-4" /> Review Catalog
            </Link>
            <Link href="/vendor/orders" className="inline-flex h-11 items-center gap-2 rounded-full border border-blue-200 px-5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50">
              Manage Orders <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.7)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-300">Pulse</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">What&apos;s happening now</h2>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <p className="text-sm font-semibold text-white">Inventory health</p>
              <p className="mt-1 text-sm text-slate-300">Your products are visible and editable from the products page.</p>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <p className="text-sm font-semibold text-white">Order flow</p>
              <p className="mt-1 text-sm text-slate-300">Use the orders screen to keep fulfillment moving.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
