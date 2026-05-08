'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Save, Truck } from 'lucide-react';

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
    <div className="max-w-3xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="h-7 w-7 text-blue-600" /> Shipping Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Set the shipping charge for one piece and the weight-based charge for larger orders.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {saving ? 'Saving...' : 'Save Shipping'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-1">Shipping per Piece</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={config.shippingPerPiece}
              onChange={(e) => setConfig((prev) => ({ ...prev, shippingPerPiece: e.target.value === '' ? 0 : Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-2">Used when the cart contains one unit.</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-1">Shipping per Weight Unit</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={config.shippingPerWeight}
              onChange={(e) => setConfig((prev) => ({ ...prev, shippingPerWeight: e.target.value === '' ? 0 : Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-2">Used for each unit when the cart contains more than one item.</p>
          </div>
        </div>
      </div>
    </div>
  );
}