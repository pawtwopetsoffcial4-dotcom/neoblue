'use client';

import { useState, useEffect } from 'react';
import { Info, Plus, Trash2, Gauge, AlertCircle } from 'lucide-react';

interface ShippingRange {
  id: string;
  weightRange: string;
  estimatedQuantity: string;
  charge: number | '';
}

export default function VendorShippingSettingsPage() {
  const [ranges, setRanges] = useState<ShippingRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/vendor/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.shippingRanges && data.shippingRanges.length > 0) {
          setRanges(data.shippingRanges);
        } else {
          // Default empty range
          setRanges([{ id: Math.random().toString(36).substr(2, 9), weightRange: '', estimatedQuantity: '', charge: '' }]);
        }
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Failed to load settings.' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAddRange = () => {
    setRanges([
      ...ranges,
      { id: Math.random().toString(36).substr(2, 9), weightRange: '', estimatedQuantity: '', charge: '' }
    ]);
  };

  const handleRemoveRange = (id: string) => {
    setRanges(ranges.filter((r) => r.id !== id));
  };

  const handleChange = (id: string, field: keyof ShippingRange, value: string) => {
    setRanges(ranges.map((r) => {
      if (r.id === id) {
        if (field === 'charge') {
          return { ...r, charge: value === '' ? '' : Number(value) };
        }
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });
      const res = await fetch('/api/vendor/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingRanges: ranges }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setMessage({ type: 'success', text: 'Shipping charges saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-20 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <section className="rounded-4xl bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100">Settings</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Shipping Charges</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
          Configure default shipping charges based on weight ranges.
        </p>
      </section>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              B. Shipping Charge Per Weight (KG) <Info className="h-4 w-4 text-slate-400" />
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set shipping charges based on total weight of the shipment.
            </p>
          </div>
          <button 
            onClick={handleAddRange}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-slate-50 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Range
          </button>
        </div>

        {/* Header row (hidden on small screens) */}
        <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_40px] gap-4 mb-3 px-2">
          <div className="text-sm font-bold text-slate-900">Weight Range</div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            Estimated Quantity <Info className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-sm font-bold text-slate-900">Shipping Charge (₹)</div>
          <div></div>
        </div>

        <div className="space-y-3">
          {ranges.map((range) => (
            <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_40px] gap-3 md:gap-4 items-center">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Weight Range</label>
                <input 
                  type="text" 
                  value={range.weightRange}
                  onChange={(e) => handleChange(range.id, 'weightRange', e.target.value)}
                  placeholder="e.g. Up to 0.5 KG"
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Estimated Quantity</label>
                <input 
                  type="text" 
                  value={range.estimatedQuantity}
                  onChange={(e) => handleChange(range.id, 'estimatedQuantity', e.target.value)}
                  placeholder="e.g. ~ 2 - 4 Pieces"
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div className="relative">
                <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Shipping Charge</label>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium md:top-6 md:-mt-0.5">₹</span>
                <input 
                  type="number" 
                  value={range.charge}
                  onChange={(e) => handleChange(range.id, 'charge', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-12 rounded-xl border border-slate-200 pl-8 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end md:justify-center">
                <button 
                  onClick={() => handleRemoveRange(range.id)}
                  disabled={ranges.length === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors mt-6 md:mt-0"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-blue-50/50 p-4 border border-blue-100 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-blue-800">
            Tip: Weight includes water, packing, and container.
          </p>
        </div>

        <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}