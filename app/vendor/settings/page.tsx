'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Save, Settings2, Truck } from 'lucide-react';

export default function VendorShippingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    shippingPerPiece: 0,
    shippingPerWeight: 0,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('authToken') ?? '';
        const res = await fetch('/api/config', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        setConfig({
          shippingPerPiece: Number(data?.shippingPerPiece) || 0,
          shippingPerWeight: Number(data?.shippingPerWeight) || 0,
        });
      } catch (error) {
        console.error('Error fetching shipping settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        shippingPerPiece: Number(config.shippingPerPiece) >= 0 ? Number(config.shippingPerPiece) : 0,
        shippingPerWeight: Number(config.shippingPerWeight) >= 0 ? Number(config.shippingPerWeight) : 0,
      };

      const token = localStorage.getItem('authToken') ?? '';
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Shipping charges saved successfully!');
      } else {
        alert('Failed to save shipping charges.');
      }
    } catch (error) {
      console.error('Error saving shipping charges:', error);
      alert('Error saving shipping charges.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <section className="rounded-4xl bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100">Preferences</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Shipping Settings</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
          Configure charges for one piece and larger orders from a cleaner, more focused settings screen.
        </p>
      </section>

      <div className="flex flex-col gap-4 rounded-4xl border border-blue-100 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-black text-slate-900">
            <Truck className="h-7 w-7 text-blue-600" /> Shipping Settings
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Set the shipping charge for one piece and the weight-based charge for larger orders.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {saving ? 'Saving...' : 'Save Shipping'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-4xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-1 block text-sm font-bold text-slate-700">Shipping per Piece</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={config.shippingPerPiece}
              onChange={(e) => setConfig((prev) => ({ ...prev, shippingPerPiece: e.target.value === '' ? 0 : Number(e.target.value) }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            <p className="mt-2 text-xs text-slate-500">Used when the cart contains one unit.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-1 block text-sm font-bold text-slate-700">Shipping per Weight Unit</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={config.shippingPerWeight}
              onChange={(e) => setConfig((prev) => ({ ...prev, shippingPerWeight: e.target.value === '' ? 0 : Number(e.target.value) }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            <p className="mt-2 text-xs text-slate-500">Used for each unit when the cart contains more than one item.</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-linear-to-r from-blue-50 to-cyan-50 p-4 ring-1 ring-blue-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Shipping controls</p>
              <p className="text-sm text-slate-600">These settings are used across the vendor flow to keep pricing consistent.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}