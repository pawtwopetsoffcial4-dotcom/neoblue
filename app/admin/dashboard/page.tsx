"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Plus, Loader2, Trash2 } from 'lucide-react';

type AdminOrder = { _id: string; totalAmount: number; status: string };
type AdminUser = { _id: string; role: 'user' | 'vendor' | 'admin' };
type AdminConfig = { categories?: string[] };

const normalizeCategory = (value: string) => value.trim().replace(/\s+/g, ' ');

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

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

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        const response = await fetch('/api/config', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load config');
        }

        const data = (await response.json()) as AdminConfig;
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        setCategories([]);
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const vendorCount = users.filter((user) => user.role === 'vendor').length;

  const uniqueCategories = useMemo(() => Array.from(new Set(categories.map(normalizeCategory))).filter(Boolean), [categories]);

  const addCategory = () => {
    const nextCategory = normalizeCategory(categoryInput);
    if (!nextCategory) return;

    setCategories((current) => Array.from(new Set([...current, nextCategory])));
    setCategoryInput('');
    setConfigMessage(null);
  };

  const removeCategory = (category: string) => {
    setCategories((current) => current.filter((item) => item !== category));
    setConfigMessage(null);
  };

  const saveCategories = async () => {
    try {
      setConfigSaving(true);
      setConfigMessage(null);

      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: uniqueCategories }),
      });

      if (!response.ok) {
        throw new Error('Failed to save categories');
      }

      const data = (await response.json()) as AdminConfig;
      setCategories(Array.isArray(data.categories) ? data.categories : uniqueCategories);
      setConfigMessage('Categories saved.');
    } catch (error: any) {
      setConfigMessage(error?.message || 'Unable to save categories.');
    } finally {
      setConfigSaving(false);
    }
  };

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

      <section className="rounded-2xl bg-white border border-blue-100 p-5 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Catalog</p>
          <h2 className="text-xl font-black tracking-tight">Category Management</h2>
          <p className="text-sm text-slate-500 mt-1">Add new category names for products, category pages, and the homepage.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={categoryInput}
            onChange={(event) => setCategoryInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCategory();
              }
            }}
            placeholder="New category name"
            className="h-11 flex-1 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addCategory}
            className="h-11 px-5 rounded-xl bg-blue-600 text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
          <button
            type="button"
            onClick={saveCategories}
            disabled={configSaving}
            className="h-11 px-5 rounded-xl border border-blue-200 text-blue-700 font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors disabled:opacity-60"
          >
            {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </button>
        </div>

        {configMessage ? <p className="text-sm text-slate-600">{configMessage}</p> : null}

        {configLoading ? (
          <div className="text-sm text-slate-500">Loading categories...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800"
              >
                {category}
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  className="text-blue-500 hover:text-blue-700"
                  aria-label={`Remove ${category}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {uniqueCategories.length === 0 ? (
              <p className="text-sm text-slate-500">No custom categories yet.</p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
