"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

type VendorOrder = {
  _id: string;
  totalAmount: number;
  status: 'placed' | 'accepted' | 'preparing' | 'completed' | 'cancelled';
  createdAt: string;
};

const statuses: VendorOrder['status'][] = ['placed', 'accepted', 'preparing', 'completed', 'cancelled'];

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);

  const loadOrders = async () => {
    try {
      const response = (await apiClient.getOrders()) as { orders: VendorOrder[] };
      setOrders(response.orders ?? []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId: string, status: VendorOrder['status']) => {
    try {
      await apiClient.updateOrderStatus(orderId, status);
      loadOrders();
    } catch {
      // keep MVP simple
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Operations</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Vendor Orders</h1>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order._id} className="rounded-2xl bg-white border border-blue-100 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                <p className="text-sm text-slate-500 mt-1">₹{order.totalAmount.toFixed(2)} • {new Date(order.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-700 capitalize">{order.status}</span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value as VendorOrder['status'])}
                  className="h-10 px-4 rounded-xl border border-blue-200 outline-none"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </article>
        ))}

        {orders.length === 0 && (
          <div className="rounded-2xl bg-white border border-blue-100 p-8 text-center text-slate-600">
            No vendor orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
