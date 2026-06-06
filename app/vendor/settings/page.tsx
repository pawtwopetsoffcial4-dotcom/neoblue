'use client';

import { useState, useEffect } from 'react';
import { Info, Plus, Trash2, AlertCircle, Pencil, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

interface ShippingRange {
  id: string;
  weightRange: string;
  estimatedQuantity: string;
  charge: number | '';
}

interface VendorProduct {
  _id: string;
  title: string;
  images: string[];
  category: string;
  subcategory?: string;
  waterType: string;
  approvalStatus: string;
  [key: string]: any;
}

// Category definitions
const CATEGORIES = [
  { key: '1', label: 'A. 1-2 Pieces', subtitle: 'Shipping charges when buyer orders 1-2 pieces.' },
  { key: '2', label: 'B. 3-5 Pieces', subtitle: 'Shipping charges when buyer orders 3-5 pieces.' },
  { key: '3', label: 'C. 6-10 Pieces', subtitle: 'Shipping charges when buyer orders 6-10 pieces.' },
  { key: '4', label: 'D. 10+ Pieces', subtitle: 'Shipping charges when buyer orders 10 or more pieces.' },
];

const REGIONS = [
  { key: 'North', emoji: '🏔️', label: 'North India Shipping', subtitle: 'Shipping charges for deliveries within North India', borderColor: 'border-blue-100', bgColor: 'bg-blue-50/30', tipBg: 'bg-[#e8f0fe]', tipBorder: 'border-blue-200', tipText: 'text-blue-800', tipIcon: 'text-blue-600', iconBg: 'bg-blue-600', tip: 'North India includes states like Delhi, UP, Rajasthan, Punjab, Haryana, MP, etc.' },
  { key: 'South', emoji: '🌴', label: 'South India Shipping', subtitle: 'Shipping charges for deliveries within South India', borderColor: 'border-orange-100', bgColor: 'bg-orange-50/30', tipBg: 'bg-[#fff3e0]', tipBorder: 'border-orange-200', tipText: 'text-orange-800', tipIcon: 'text-orange-600', iconBg: 'bg-orange-500', tip: 'South India includes states like Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana, etc.' },
];

// Default ranges per category
function getDefaults(region: string, cat: string): ShippingRange[] {
  const isSouth = region === 'South';
  const base = isSouth ? 40 : 0; // South India surcharge

  if (cat === '1') return [
    { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 60 + base },
    { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 90 + base },
  ];
  if (cat === '2') return [
    { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 3 - 5 Pieces', charge: 80 + base },
    { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 4 - 6 Pieces', charge: 110 + base },
    { id: uuidv4(), weightRange: '1 - 1.5 KG', estimatedQuantity: '~ 5 - 7 Pieces', charge: 140 + base },
  ];
  if (cat === '3') return [
    { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 6 - 8 Pieces', charge: 120 + base },
    { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 7 - 9 Pieces', charge: 150 + base },
    { id: uuidv4(), weightRange: '1 - 1.5 KG', estimatedQuantity: '~ 8 - 10 Pieces', charge: 180 + base },
    { id: uuidv4(), weightRange: '1.5 - 2 KG', estimatedQuantity: '~ 9 - 12 Pieces', charge: 210 + base },
  ];
  // cat === '4'
  return [
    { id: uuidv4(), weightRange: 'Up to 1 KG', estimatedQuantity: '~ 10 - 12 Pieces', charge: 180 + base },
    { id: uuidv4(), weightRange: '1 - 2 KG', estimatedQuantity: '~ 12 - 15 Pieces', charge: 220 + base },
    { id: uuidv4(), weightRange: '2 - 3 KG', estimatedQuantity: '~ 15 - 20 Pieces', charge: 280 + base },
    { id: uuidv4(), weightRange: 'Above 3 KG', estimatedQuantity: '20+ Pieces', charge: 350 + base },
  ];
}

function cloneRanges(ranges: ShippingRange[]): ShippingRange[] {
  return ranges.map(r => ({ ...r, id: uuidv4() }));
}

// Helper to build the field name
function fieldName(region: string, cat: string) {
  return `shipping${region}${cat}Ranges`;
}

// Reusable table component
function ShippingTable({
  title, subtitle, ranges, onAdd, onRemove, onChange,
}: {
  title: string; subtitle: string; ranges: ShippingRange[];
  onAdd: () => void; onRemove: (id: string) => void;
  onChange: (id: string, field: keyof ShippingRange, value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            {title} <Info className="h-3.5 w-3.5 text-slate-400" />
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        <button onClick={onAdd} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-blue-600 hover:bg-slate-50 transition-colors shadow-sm shrink-0">
          <Plus className="h-3.5 w-3.5" /> Add Range
        </button>
      </div>
      <div className="hidden md:grid grid-cols-[1.3fr_1.3fr_1fr_36px] gap-3 mb-2 px-1">
        <div className="text-xs font-bold text-slate-600">Weight Range</div>
        <div className="text-xs font-bold text-slate-600 flex items-center gap-1">Estimated Quantity <Info className="h-3 w-3 text-slate-400" /></div>
        <div className="text-xs font-bold text-slate-600">Shipping Charge (₹)</div>
        <div></div>
      </div>
      <div className="space-y-2">
        {ranges.map((range) => (
          <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.3fr_1.3fr_1fr_36px] gap-2 md:gap-3 items-center">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 mb-1 block md:hidden">Weight Range</label>
              <input type="text" value={range.weightRange} onChange={(e) => onChange(range.id, 'weightRange', e.target.value)} placeholder="e.g. Up to 0.5 KG" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 mb-1 block md:hidden">Estimated Quantity</label>
              <input type="text" value={range.estimatedQuantity} onChange={(e) => onChange(range.id, 'estimatedQuantity', e.target.value)} placeholder="e.g. ~ 2 - 4 Pieces" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
            </div>
            <div className="relative">
              <label className="text-[10px] font-semibold text-slate-500 mb-1 block md:hidden">Shipping Charge</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
              <input type="number" value={range.charge} onChange={(e) => onChange(range.id, 'charge', e.target.value)} placeholder="0" min="0" className="w-full h-9 rounded-lg border border-slate-200 pl-7 pr-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
            </div>
            <div className="flex justify-end md:justify-center">
              <button onClick={() => onRemove(range.id)} disabled={ranges.length === 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VendorShippingSettingsPage() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // 8 state arrays: North1-4, South1-4
  const [ranges, setRanges] = useState<Record<string, ShippingRange[]>>(() => {
    const init: Record<string, ShippingRange[]> = {};
    for (const r of REGIONS) {
      for (const c of CATEGORIES) {
        init[fieldName(r.key, c.key)] = cloneRanges(getDefaults(r.key, c.key));
      }
    }
    return init;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
          if (data.products.length > 0) {
            const first = data.products[0];
            setSelectedProductId(first._id);
            loadProductShipping(first);
          }
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load products.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const loadProductShipping = (product: VendorProduct) => {
    const newRanges: Record<string, ShippingRange[]> = {};
    for (const r of REGIONS) {
      for (const c of CATEGORIES) {
        const key = fieldName(r.key, c.key);
        const productRanges = product[key];
        newRanges[key] = productRanges?.length
          ? productRanges.map((x: any) => ({ ...x, id: x.id || uuidv4() }))
          : cloneRanges(getDefaults(r.key, c.key));
      }
    }
    setRanges(newRanges);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setMessage({ type: '', text: '' });
    const product = products.find(p => p._id === productId);
    if (product) loadProductShipping(product);
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);

  // Generic handlers for any field key
  const handleAdd = (key: string) => {
    setRanges(prev => ({ ...prev, [key]: [...prev[key], { id: uuidv4(), weightRange: '', estimatedQuantity: '', charge: '' }] }));
  };
  const handleRemove = (key: string, id: string) => {
    setRanges(prev => ({ ...prev, [key]: prev[key].filter(r => r.id !== id) }));
  };
  const handleChange = (key: string, id: string, field: keyof ShippingRange, value: string) => {
    setRanges(prev => ({
      ...prev,
      [key]: prev[key].map(r => {
        if (r.id === id) {
          if (field === 'charge') return { ...r, charge: value === '' ? '' : Number(value) };
          return { ...r, [field]: value };
        }
        return r;
      }),
    }));
  };

  const handleSave = async () => {
    if (!selectedProductId) {
      setMessage({ type: 'error', text: 'Please select a product first.' });
      return;
    }
    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });
      const res = await fetch(`/api/products/${selectedProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ranges),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setProducts(prev => prev.map(p => p._id === selectedProductId ? { ...p, ...ranges } : p));
      setMessage({ type: 'success', text: 'Shipping charges saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl py-20 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const generateSKU = (product: VendorProduct) => {
    const cat = product.title.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3);
    return `NBS-${cat}-001`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 py-6 text-slate-900 bg-white min-h-screen p-4 sm:p-6 lg:p-8">

      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Shipping Charges Setup</h1>
        <p className="text-sm text-slate-500 mt-1">Set shipping charges for your aquatic products and varieties.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      {/* Select Variety */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 min-w-0">
            <label className="text-sm font-medium text-slate-500 mb-2 block">Select Variety</label>
            <div className="relative">
              <select value={selectedProductId} onChange={(e) => handleSelectProduct(e.target.value)} className="w-full h-11 appearance-none rounded-lg border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                {products.map((product) => (
                  <option key={product._id} value={product._id}>{product.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          {selectedProduct && (
            <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex-1 min-w-0">
              <div className="h-20 w-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                {selectedProduct.images?.[0] && (
                  <Image src={selectedProduct.images[0]} alt={selectedProduct.title} width={80} height={80} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{selectedProduct.title}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${selectedProduct.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedProduct.approvalStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {selectedProduct.approvalStatus === 'approved' ? 'Active' : selectedProduct.approvalStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Category: {selectedProduct.waterType} {selectedProduct.category}</p>
                <p className="text-xs text-slate-500">SKU: {generateSKU(selectedProduct)}</p>
                <button onClick={() => document.querySelector('select')?.focus()} className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Change Variety <Pencil className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Region sections */}
      {REGIONS.map((region) => (
        <div key={region.key} className={`rounded-2xl border-2 ${region.borderColor} ${region.bgColor} p-4 sm:p-6 space-y-4`}>
          <div className="flex items-center gap-3 mb-1">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${region.iconBg} text-white text-lg`}>{region.emoji}</div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{region.label}</h2>
              <p className="text-xs text-slate-500">{region.subtitle}</p>
            </div>
          </div>

          {CATEGORIES.map((cat) => {
            const key = fieldName(region.key, cat.key);
            return (
              <ShippingTable
                key={key}
                title={cat.label}
                subtitle={cat.subtitle}
                ranges={ranges[key] || []}
                onAdd={() => handleAdd(key)}
                onRemove={(id) => handleRemove(key, id)}
                onChange={(id, field, value) => handleChange(key, id, field, value)}
              />
            );
          })}

          <div className={`rounded-lg ${region.tipBg} p-3 ${region.tipBorder} border flex items-start gap-2`}>
            <Info className={`h-4 w-4 ${region.tipIcon} shrink-0 mt-0.5`} />
            <p className={`text-sm font-medium ${region.tipText}`}>
              Tip: {region.tip}
            </p>
          </div>
        </div>
      ))}

      {/* Important Notes */}
      <div className="rounded-xl bg-[#f4f7fa] p-5 sm:p-6 shadow-sm border border-slate-100">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-3">
          <Info className="h-5 w-5 text-blue-500" />
          Important Notes
        </h3>
        <ul className="list-disc pl-9 text-sm text-slate-700 space-y-1.5">
          <li>Shipping charges will be visible to buyers at checkout based on their delivery region.</li>
          <li>You can update these charges anytime.</li>
          <li>Make sure the ranges are correct to avoid calculation issues.</li>
          <li>Weight includes water, packing, and container.</li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2 pb-10">
        <button onClick={handleSave} disabled={isSaving || !selectedProductId} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-600/20">
          {isSaving ? 'Saving...' : '💾 Save Shipping Charges'}
        </button>
      </div>

    </div>
  );
}