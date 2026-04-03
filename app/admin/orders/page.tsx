"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

type AdminOrder = {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  userId?: { name?: string; email?: string };
  vendorId?: { name?: string; email?: string };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = (await apiClient.getAdminOrders()) as { orders: AdminOrder[] };
        setOrders(response.orders ?? []);
      } catch {
        setOrders([]);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Monitoring</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">All Orders</h1>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order._id} className="rounded-2xl bg-white border border-blue-100 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                <p className="text-sm text-slate-500 mt-1">${order.totalAmount.toFixed(2)} • {new Date(order.createdAt).toLocaleString()}</p>
                <p className="text-xs text-slate-600 mt-2">User: {order.userId?.name ?? order.userId?.email ?? 'N/A'}</p>
                <p className="text-xs text-slate-600">Vendor: {order.vendorId?.name ?? order.vendorId?.email ?? 'N/A'}</p>
              </div>

              <span className="inline-flex h-9 px-4 rounded-full bg-blue-50 border border-blue-200 text-blue-700 items-center text-sm font-semibold capitalize">
                {order.status}
              </span>
            </div>
          </article>
        ))}

        {orders.length === 0 && (
          <div className="rounded-2xl bg-white border border-blue-100 p-8 text-center text-slate-600">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}
