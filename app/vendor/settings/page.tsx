'use client';

import { useState, useEffect } from 'react';
import { Info, Plus, Trash2, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ShippingPieceRange {
  id: string;
  pieceRange: string;
  estimatedQuantity: string;
  charge: number | '';
}

interface ShippingWeightRange {
  id: string;
  weightRange: string;
  estimatedQuantity: string;
  charge: number | '';
}

const defaultPieceRanges: ShippingPieceRange[] = [
  { id: uuidv4(), pieceRange: '2 - 4 Pieces', estimatedQuantity: '~ 2 - 4 Pieces', charge: 60 },
  { id: uuidv4(), pieceRange: '4 - 8 Pieces', estimatedQuantity: '~ 4 - 8 Pieces', charge: 80 },
  { id: uuidv4(), pieceRange: '8 - 10 Pieces', estimatedQuantity: '~ 8 - 10 Pieces', charge: 100 },
  { id: uuidv4(), pieceRange: '10 - 15 Pieces', estimatedQuantity: '~ 10 - 15 Pieces', charge: 120 },
  { id: uuidv4(), pieceRange: '15 - 20 Pieces', estimatedQuantity: '~ 15 - 20 Pieces', charge: 150 },
];

const defaultWeightRanges: ShippingWeightRange[] = [
  { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 2 - 4 Pieces', charge: 60 },
  { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 4 - 6 Pieces', charge: 90 },
  { id: uuidv4(), weightRange: '1 - 1.5 KG', estimatedQuantity: '~ 6 - 8 Pieces', charge: 120 },
  { id: uuidv4(), weightRange: '1.5 - 2 KG', estimatedQuantity: '~ 8 - 12 Pieces', charge: 150 },
  { id: uuidv4(), weightRange: '2 - 3 KG', estimatedQuantity: '~ 12 - 20 Pieces', charge: 180 },
  { id: uuidv4(), weightRange: 'Above 3 KG', estimatedQuantity: '20+ Pieces', charge: 200 },
];

export default function VendorShippingSettingsPage() {
  const [pieceRanges, setPieceRanges] = useState<ShippingPieceRange[]>([]);
  const [weightRanges, setWeightRanges] = useState<ShippingWeightRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/vendor/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.shippingPieceRanges && data.shippingPieceRanges.length > 0) {
          setPieceRanges(data.shippingPieceRanges);
        } else {
          setPieceRanges(defaultPieceRanges);
        }

        if (data.shippingWeightRanges && data.shippingWeightRanges.length > 0) {
          setWeightRanges(data.shippingWeightRanges);
        } else {
          setWeightRanges(defaultWeightRanges);
        }
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Failed to load settings.' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAddPieceRange = () => {
    setPieceRanges([
      ...pieceRanges,
      { id: uuidv4(), pieceRange: '', estimatedQuantity: '', charge: '' }
    ]);
  };

  const handleRemovePieceRange = (id: string) => {
    setPieceRanges(pieceRanges.filter((r) => r.id !== id));
  };

  const handleChangePieceRange = (id: string, field: keyof ShippingPieceRange, value: string) => {
    setPieceRanges(pieceRanges.map((r) => {
      if (r.id === id) {
        if (field === 'charge') {
          return { ...r, charge: value === '' ? '' : Number(value) };
        }
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleAddWeightRange = () => {
    setWeightRanges([
      ...weightRanges,
      { id: uuidv4(), weightRange: '', estimatedQuantity: '', charge: '' }
    ]);
  };

  const handleRemoveWeightRange = (id: string) => {
    setWeightRanges(weightRanges.filter((r) => r.id !== id));
  };

  const handleChangeWeightRange = (id: string, field: keyof ShippingWeightRange, value: string) => {
    setWeightRanges(weightRanges.map((r) => {
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
        body: JSON.stringify({ shippingPieceRanges: pieceRanges, shippingWeightRanges: weightRanges }),
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
    <div className="mx-auto max-w-4xl space-y-4 py-6 text-slate-900 bg-white min-h-screen p-4 sm:p-6 lg:p-8">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Shipping Charges Setup</h1>
        <p className="text-sm text-slate-500 mt-1">Set shipping charges for your aquatic products and varieties.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      {/* Section A: Pieces */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold">
              A. Shipping Charges Per Number of Pieces <Info className="h-4 w-4 text-slate-400" />
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set shipping charges based on the number of pieces.
            </p>
          </div>
          <button 
            onClick={handleAddPieceRange}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-blue-600 hover:bg-slate-50 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Range
          </button>
        </div>

        <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_40px] gap-4 mb-3 px-2">
          <div className="text-sm font-bold">Pieces Range</div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            Estimated Quantity <Info className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-sm font-bold">Shipping Charge (₹)</div>
          <div></div>
        </div>

        <div className="space-y-3">
          {pieceRanges.map((range) => (
            <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_40px] gap-3 md:gap-4 items-center">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Pieces Range</label>
                <input 
                  type="text" 
                  value={range.pieceRange}
                  onChange={(e) => handleChangePieceRange(range.id, 'pieceRange', e.target.value)}
                  placeholder="e.g. 2 - 4 Pieces"
                  className="w-full h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Estimated Quantity</label>
                <input 
                  type="text" 
                  value={range.estimatedQuantity}
                  onChange={(e) => handleChangePieceRange(range.id, 'estimatedQuantity', e.target.value)}
                  placeholder="e.g. ~ 2 - 4 Shrimp"
                  className="w-full h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              
              <div className="relative">
                <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Shipping Charge</label>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium md:top-5.5 md:-mt-0.5">₹</span>
                <input 
                  type="number" 
                  value={range.charge}
                  onChange={(e) => handleChangePieceRange(range.id, 'charge', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-11 rounded-lg border border-slate-200 pl-8 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              
              <div className="flex justify-end md:justify-center">
                <button 
                  onClick={() => handleRemovePieceRange(range.id)}
                  disabled={pieceRanges.length === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors mt-6 md:mt-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-[#f0f4fa] p-3 border border-blue-100 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-blue-800">
            Tip: Shipping charges will be auto-calculated for buyers based on quantity.
          </p>
        </div>
      </div>

      {/* Section B: Weight */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold">
              B. Shipping Charge Per Weight (KG) <Info className="h-4 w-4 text-slate-400" />
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set shipping charges based on total weight of the shipment.
            </p>
          </div>
          <button 
            onClick={handleAddWeightRange}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-blue-600 hover:bg-slate-50 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Range
          </button>
        </div>

        <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_40px] gap-4 mb-3 px-2">
          <div className="text-sm font-bold">Weight Range</div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            Estimated Quantity <Info className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-sm font-bold">Shipping Charge (₹)</div>
          <div></div>
        </div>

        <div className="space-y-3">
          {weightRanges.map((range) => (
            <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_40px] gap-3 md:gap-4 items-center">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Weight Range</label>
                <input 
                  type="text" 
                  value={range.weightRange}
                  onChange={(e) => handleChangeWeightRange(range.id, 'weightRange', e.target.value)}
                  placeholder="e.g. Up to 0.5 KG"
                  className="w-full h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Estimated Quantity</label>
                <input 
                  type="text" 
                  value={range.estimatedQuantity}
                  onChange={(e) => handleChangeWeightRange(range.id, 'estimatedQuantity', e.target.value)}
                  placeholder="e.g. ~ 2 - 4 Pieces"
                  className="w-full h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              
              <div className="relative">
                <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Shipping Charge</label>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium md:top-5.5 md:-mt-0.5">₹</span>
                <input 
                  type="number" 
                  value={range.charge}
                  onChange={(e) => handleChangeWeightRange(range.id, 'charge', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-11 rounded-lg border border-slate-200 pl-8 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              
              <div className="flex justify-end md:justify-center">
                <button 
                  onClick={() => handleRemoveWeightRange(range.id)}
                  disabled={weightRanges.length === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors mt-6 md:mt-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-[#f0f4fa] p-3 border border-blue-100 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-blue-800">
            Tip: Weight includes water, packing, and container.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-[#f4f7fa] p-5 sm:p-6 shadow-sm border border-slate-100 mt-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-3">
          <Info className="h-5 w-5 text-blue-500" />
          Important Notes
        </h3>
        <ul className="list-disc pl-9 text-sm text-slate-700 space-y-1.5">
          <li>Shipping charges will be visible to buyers at checkout.</li>
          <li>You can update these charges anytime.</li>
          <li>Make sure the ranges are correct to avoid calculation issues.</li>
        </ul>
      </div>

      <div className="mt-8 flex justify-end pt-2 pb-10">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
        >
          {isSaving ? 'Saving...' : 'Save Shipping Charges'}
        </button>
      </div>

    </div>
  );
}