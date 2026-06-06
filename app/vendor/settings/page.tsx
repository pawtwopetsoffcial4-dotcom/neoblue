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
  shippingNorthSmallRanges?: ShippingRange[];
  shippingNorthBulkRanges?: ShippingRange[];
  shippingSouthSmallRanges?: ShippingRange[];
  shippingSouthBulkRanges?: ShippingRange[];
}

const defaultNorthSmall: ShippingRange[] = [
  { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 60 },
  { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 90 },
];

const defaultNorthBulk: ShippingRange[] = [
  { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 3 - 5 Pieces', charge: 80 },
  { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 4 - 6 Pieces', charge: 110 },
  { id: uuidv4(), weightRange: '1 - 1.5 KG', estimatedQuantity: '~ 6 - 8 Pieces', charge: 140 },
  { id: uuidv4(), weightRange: '1.5 - 2 KG', estimatedQuantity: '~ 8 - 12 Pieces', charge: 170 },
  { id: uuidv4(), weightRange: '2 - 3 KG', estimatedQuantity: '~ 12 - 20 Pieces', charge: 200 },
  { id: uuidv4(), weightRange: 'Above 3 KG', estimatedQuantity: '20+ Pieces', charge: 250 },
];

const defaultSouthSmall: ShippingRange[] = [
  { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 100 },
  { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 140 },
];

const defaultSouthBulk: ShippingRange[] = [
  { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 3 - 5 Pieces', charge: 120 },
  { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 4 - 6 Pieces', charge: 160 },
  { id: uuidv4(), weightRange: '1 - 1.5 KG', estimatedQuantity: '~ 6 - 8 Pieces', charge: 200 },
  { id: uuidv4(), weightRange: '1.5 - 2 KG', estimatedQuantity: '~ 8 - 12 Pieces', charge: 240 },
  { id: uuidv4(), weightRange: '2 - 3 KG', estimatedQuantity: '~ 12 - 20 Pieces', charge: 280 },
  { id: uuidv4(), weightRange: 'Above 3 KG', estimatedQuantity: '20+ Pieces', charge: 350 },
];

function cloneRanges(ranges: ShippingRange[]): ShippingRange[] {
  return ranges.map(r => ({ ...r, id: uuidv4() }));
}

// Reusable table component
function ShippingTable({
  title,
  subtitle,
  ranges,
  onAdd,
  onRemove,
  onChange,
}: {
  title: string;
  subtitle: string;
  ranges: ShippingRange[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof ShippingRange, value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            {title} <Info className="h-3.5 w-3.5 text-slate-400" />
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        <button
          onClick={onAdd}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-blue-600 hover:bg-slate-50 transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> Add Range
        </button>
      </div>

      <div className="hidden md:grid grid-cols-[1.3fr_1.3fr_1fr_36px] gap-3 mb-2 px-1">
        <div className="text-xs font-bold text-slate-600">Weight Range</div>
        <div className="text-xs font-bold text-slate-600 flex items-center gap-1">
          Estimated Quantity <Info className="h-3 w-3 text-slate-400" />
        </div>
        <div className="text-xs font-bold text-slate-600">Shipping Charge (₹)</div>
        <div></div>
      </div>

      <div className="space-y-2.5">
        {ranges.map((range) => (
          <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.3fr_1.3fr_1fr_36px] gap-2.5 md:gap-3 items-center">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 mb-1 block md:hidden">Weight Range</label>
              <input
                type="text"
                value={range.weightRange}
                onChange={(e) => onChange(range.id, 'weightRange', e.target.value)}
                placeholder="e.g. Up to 0.5 KG"
                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 mb-1 block md:hidden">Estimated Quantity</label>
              <input
                type="text"
                value={range.estimatedQuantity}
                onChange={(e) => onChange(range.id, 'estimatedQuantity', e.target.value)}
                placeholder="e.g. ~ 2 - 4 Pieces"
                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="relative">
              <label className="text-[10px] font-semibold text-slate-500 mb-1 block md:hidden">Shipping Charge</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
              <input
                type="number"
                value={range.charge}
                onChange={(e) => onChange(range.id, 'charge', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full h-10 rounded-lg border border-slate-200 pl-7 pr-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex justify-end md:justify-center">
              <button
                onClick={() => onRemove(range.id)}
                disabled={ranges.length === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <Trash2 className="h-4 w-4" />
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
  const [northSmall, setNorthSmall] = useState<ShippingRange[]>(cloneRanges(defaultNorthSmall));
  const [northBulk, setNorthBulk] = useState<ShippingRange[]>(cloneRanges(defaultNorthBulk));
  const [southSmall, setSouthSmall] = useState<ShippingRange[]>(cloneRanges(defaultSouthSmall));
  const [southBulk, setSouthBulk] = useState<ShippingRange[]>(cloneRanges(defaultSouthBulk));
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
    setNorthSmall(product.shippingNorthSmallRanges?.length ? product.shippingNorthSmallRanges.map(r => ({ ...r, id: r.id || uuidv4() })) : cloneRanges(defaultNorthSmall));
    setNorthBulk(product.shippingNorthBulkRanges?.length ? product.shippingNorthBulkRanges.map(r => ({ ...r, id: r.id || uuidv4() })) : cloneRanges(defaultNorthBulk));
    setSouthSmall(product.shippingSouthSmallRanges?.length ? product.shippingSouthSmallRanges.map(r => ({ ...r, id: r.id || uuidv4() })) : cloneRanges(defaultSouthSmall));
    setSouthBulk(product.shippingSouthBulkRanges?.length ? product.shippingSouthBulkRanges.map(r => ({ ...r, id: r.id || uuidv4() })) : cloneRanges(defaultSouthBulk));
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setMessage({ type: '', text: '' });
    const product = products.find(p => p._id === productId);
    if (product) loadProductShipping(product);
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);

  // Generic handlers
  const makeHandlers = (setter: React.Dispatch<React.SetStateAction<ShippingRange[]>>) => ({
    add: () => setter(prev => [...prev, { id: uuidv4(), weightRange: '', estimatedQuantity: '', charge: '' }]),
    remove: (id: string) => setter(prev => prev.filter(r => r.id !== id)),
    change: (id: string, field: keyof ShippingRange, value: string) => {
      setter(prev => prev.map(r => {
        if (r.id === id) {
          if (field === 'charge') return { ...r, charge: value === '' ? '' : Number(value) };
          return { ...r, [field]: value };
        }
        return r;
      }));
    },
  });

  const nsHandlers = makeHandlers(setNorthSmall);
  const nbHandlers = makeHandlers(setNorthBulk);
  const ssHandlers = makeHandlers(setSouthSmall);
  const sbHandlers = makeHandlers(setSouthBulk);

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
        body: JSON.stringify({
          shippingNorthSmallRanges: northSmall,
          shippingNorthBulkRanges: northBulk,
          shippingSouthSmallRanges: southSmall,
          shippingSouthBulkRanges: southBulk,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setProducts(prev => prev.map(p =>
        p._id === selectedProductId
          ? { ...p, shippingNorthSmallRanges: northSmall, shippingNorthBulkRanges: northBulk, shippingSouthSmallRanges: southSmall, shippingSouthBulkRanges: southBulk }
          : p
      ));
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
    const cat = product.title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
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
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(e.target.value)}
                className="w-full h-11 appearance-none rounded-lg border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
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
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                    selectedProduct.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700'
                      : selectedProduct.approvalStatus === 'pending' ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                  }`}>
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

      {/* ===== NORTH INDIA ===== */}
      <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/30 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white text-lg">🏔️</div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">North India Shipping</h2>
            <p className="text-xs text-slate-500">Shipping charges for deliveries within North India</p>
          </div>
        </div>

        <ShippingTable
          title="A. 1-2 Pieces"
          subtitle="Shipping charges when buyer orders 1-2 pieces."
          ranges={northSmall}
          onAdd={nsHandlers.add}
          onRemove={nsHandlers.remove}
          onChange={nsHandlers.change}
        />

        <ShippingTable
          title="B. Other Pieces (3+)"
          subtitle="Shipping charges when buyer orders 3 or more pieces."
          ranges={northBulk}
          onAdd={nbHandlers.add}
          onRemove={nbHandlers.remove}
          onChange={nbHandlers.change}
        />

        <div className="rounded-lg bg-[#e8f0fe] p-3 border border-blue-200 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-blue-800">
            Tip: North India includes states like Delhi, UP, Rajasthan, Punjab, Haryana, MP, etc.
          </p>
        </div>
      </div>

      {/* ===== SOUTH INDIA ===== */}
      <div className="rounded-2xl border-2 border-orange-100 bg-orange-50/30 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white text-lg">🌴</div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">South India Shipping</h2>
            <p className="text-xs text-slate-500">Shipping charges for deliveries within South India</p>
          </div>
        </div>

        <ShippingTable
          title="A. 1-2 Pieces"
          subtitle="Shipping charges when buyer orders 1-2 pieces."
          ranges={southSmall}
          onAdd={ssHandlers.add}
          onRemove={ssHandlers.remove}
          onChange={ssHandlers.change}
        />

        <ShippingTable
          title="B. Other Pieces (3+)"
          subtitle="Shipping charges when buyer orders 3 or more pieces."
          ranges={southBulk}
          onAdd={sbHandlers.add}
          onRemove={sbHandlers.remove}
          onChange={sbHandlers.change}
        />

        <div className="rounded-lg bg-[#fff3e0] p-3 border border-orange-200 flex items-start gap-2">
          <Info className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-orange-800">
            Tip: South India includes states like Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana, etc.
          </p>
        </div>
      </div>

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
        <button
          onClick={handleSave}
          disabled={isSaving || !selectedProductId}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
        >
          {isSaving ? 'Saving...' : '💾 Save Shipping Charges'}
        </button>
      </div>

    </div>
  );
}