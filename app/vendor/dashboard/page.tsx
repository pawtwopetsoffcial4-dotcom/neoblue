"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

type VendorOrder = {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

export default function VendorDashboardPage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);

  useEffect(() => {
    const load = async () => {
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
    };

    load();
  }, []);

  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Overview</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Vendor Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Products</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{products.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Orders</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{orders.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="text-3xl font-black text-slate-900 mt-1">${revenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-blue-100 p-5">
        <p className="font-bold text-slate-900 mb-4">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/vendor/add-product" className="h-10 px-5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors inline-flex items-center">
            Add New Product
          </Link>
          <Link href="/vendor/orders" className="h-10 px-5 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-colors inline-flex items-center">
            Manage Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
