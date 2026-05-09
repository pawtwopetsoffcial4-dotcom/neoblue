"use client";

import React, { useEffect, useState } from 'react';
import { Clock3, PackageCheck, Truck } from 'lucide-react';
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
      <section className="rounded-[2rem] bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100">Operations</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Vendor Orders</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
          Keep fulfillment organized with a cleaner order list and faster status changes.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Placed</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{orders.filter((order) => order.status === 'placed').length}</p>
            </div>
            <Clock3 className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Active</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{orders.filter((order) => ['accepted', 'preparing'].includes(order.status)).length}</p>
            </div>
            <PackageCheck className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Completed</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{orders.filter((order) => order.status === 'completed').length}</p>
            </div>
            <Truck className="h-10 w-10 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order._id} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                <p className="text-sm text-slate-500 mt-1">₹{order.totalAmount.toFixed(2)} • {new Date(order.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold capitalize text-blue-700">
                  {order.status}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value as VendorOrder['status'])}
                  className="h-11 w-full rounded-2xl border border-blue-200 bg-slate-50 px-4 outline-none sm:w-auto"
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
          <div className="rounded-3xl border border-blue-100 bg-white p-10 text-center text-slate-600 shadow-sm">
            No vendor orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
