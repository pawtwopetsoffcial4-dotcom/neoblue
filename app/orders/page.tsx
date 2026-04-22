"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/useAuth';

type UserOrder = {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    const load = async () => {
      try {
        const response = (await apiClient.getOrders()) as { orders: UserOrder[] };
        setOrders(response.orders ?? []);
      } catch {
        setOrders([]);
      }
    };

    load();
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-white text-slate-900 pt-6 md:pt-10 pb-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-2">Orders</p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">My Orders</h1>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order._id} className="rounded-2xl border border-blue-100 bg-white p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                <p className="text-sm text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-slate-900">₹{order.totalAmount.toFixed(2)}</p>
                <p className="text-sm font-semibold text-blue-700 capitalize">{order.status}</p>
              </div>
            </div>
          </article>
        ))}

        {orders.length === 0 && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8 text-center text-slate-600">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
