"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

type AdminOrder = { _id: string; totalAmount: number; status: string };
type AdminUser = { _id: string; role: 'user' | 'vendor' | 'admin' };

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = (await apiClient.getAdminOverview()) as {
          orders: AdminOrder[];
          users: AdminUser[];
        };

        setOrders(response.orders ?? []);
        setUsers(response.users ?? []);
      } catch {
        setOrders([]);
        setUsers([]);
      }
    };

    load();
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const vendorCount = users.filter((user) => user.role === 'vendor').length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Overview</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Users</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{users.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Vendors</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{vendorCount}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Orders</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{orders.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="text-3xl font-black text-slate-900 mt-1">₹{totalRevenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
