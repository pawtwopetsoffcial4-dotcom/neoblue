'use client';

import { useState, useEffect } from 'react';
import { Info, Plus, Trash2, AlertCircle, Pencil, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

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

interface VendorProduct {
  _id: string;
  title: string;
  images: string[];
  category: string;
  subcategory?: string;
  waterType: string;
  approvalStatus: string;
  shippingPieceRanges?: ShippingPieceRange[];
  shippingWeightRanges?: ShippingWeightRange[];
}

const defaultPieceRanges: ShippingPieceRange[] = [
  { id: uuidv4(), pieceRange: '2 - 4 Pieces', estimatedQuantity: '~ 2 - 4 Shrimp', charge: 60 },
  { id: uuidv4(), pieceRange: '4 - 8 Pieces', estimatedQuantity: '~ 4 - 8 Shrimp', charge: 80 },
  { id: uuidv4(), pieceRange: '8 - 10 Pieces', estimatedQuantity: '~ 8 - 10 Shrimp', charge: 100 },
  { id: uuidv4(), pieceRange: '10 - 15 Pieces', estimatedQuantity: '~ 10 - 15 Shrimp', charge: 120 },
  { id: uuidv4(), pieceRange: '15 - 20 Pieces', estimatedQuantity: '~ 15 - 20 Shrimp', charge: 150 },
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
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [pieceRanges, setPieceRanges] = useState<ShippingPieceRange[]>(defaultPieceRanges);
  const [weightRanges, setWeightRanges] = useState<ShippingWeightRange[]>(defaultWeightRanges);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch vendor's products
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
    if (product.shippingPieceRanges && product.shippingPieceRanges.length > 0) {
      setPieceRanges(product.shippingPieceRanges.map(r => ({ ...r, id: r.id || uuidv4() })));
    } else {
      setPieceRanges(defaultPieceRanges.map(r => ({ ...r, id: uuidv4() })));
    }
    if (product.shippingWeightRanges && product.shippingWeightRanges.length > 0) {
      setWeightRanges(product.shippingWeightRanges.map(r => ({ ...r, id: r.id || uuidv4() })));
    } else {
      setWeightRanges(defaultWeightRanges.map(r => ({ ...r, id: uuidv4() })));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setMessage({ type: '', text: '' });
    const product = products.find(p => p._id === productId);
    if (product) loadProductShipping(product);
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);

  // Piece range handlers
  const handleAddPieceRange = () => {
    setPieceRanges([...pieceRanges, { id: uuidv4(), pieceRange: '', estimatedQuantity: '', charge: '' }]);
  };
  const handleRemovePieceRange = (id: string) => {
    setPieceRanges(pieceRanges.filter(r => r.id !== id));
  };
  const handleChangePieceRange = (id: string, field: keyof ShippingPieceRange, value: string) => {
    setPieceRanges(pieceRanges.map(r => {
      if (r.id === id) {
        if (field === 'charge') return { ...r, charge: value === '' ? '' : Number(value) };
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  // Weight range handlers
  const handleAddWeightRange = () => {
    setWeightRanges([...weightRanges, { id: uuidv4(), weightRange: '', estimatedQuantity: '', charge: '' }]);
  };
  const handleRemoveWeightRange = (id: string) => {
    setWeightRanges(weightRanges.filter(r => r.id !== id));
  };
  const handleChangeWeightRange = (id: string, field: keyof ShippingWeightRange, value: string) => {
    setWeightRanges(weightRanges.map(r => {
      if (r.id === id) {
        if (field === 'charge') return { ...r, charge: value === '' ? '' : Number(value) };
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  // Save to selected product
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
        body: JSON.stringify({ shippingPieceRanges: pieceRanges, shippingWeightRanges: weightRanges }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      // Update local product cache
      setProducts(prev => prev.map(p =>
        p._id === selectedProductId
          ? { ...p, shippingPieceRanges: pieceRanges, shippingWeightRanges: weightRanges }
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
      <div className="mx-auto max-w-4xl py-20 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const generateSKU = (product: VendorProduct) => {
    const prefix = 'NBS';
    const cat = product.title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
    return `${prefix}-${cat}-001`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 py-6 text-slate-900 bg-white min-h-screen p-4 sm:p-6 lg:p-8">

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

      {/* Select Variety Card */}
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
                  <Image
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.title}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{selectedProduct.title}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                    selectedProduct.approvalStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : selectedProduct.approvalStatus === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                  }`}>
                    {selectedProduct.approvalStatus === 'approved' ? 'Active' : selectedProduct.approvalStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Category: {selectedProduct.waterType} {selectedProduct.category}</p>
                <p className="text-xs text-slate-500">SKU: {generateSKU(selectedProduct)}</p>
                <button
                  onClick={() => {
                    const selectEl = document.querySelector('select');
                    selectEl?.focus();
                  }}
                  className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Change Variety <Pencil className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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

        <div className="hidden md:grid grid-cols-[1.3fr_1.3fr_1fr_40px] gap-4 mb-3 px-2">
          <div className="text-sm font-bold">Pieces Range</div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            Estimated Quantity <Info className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-sm font-bold">Shipping Charge (₹)</div>
          <div></div>
        </div>

        <div className="space-y-3">
          {pieceRanges.map((range) => (
            <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.3fr_1.3fr_1fr_40px] gap-3 md:gap-4 items-center">
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
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
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
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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

        <div className="hidden md:grid grid-cols-[1.3fr_1.3fr_1fr_40px] gap-4 mb-3 px-2">
          <div className="text-sm font-bold">Weight Range</div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            Estimated Quantity <Info className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-sm font-bold">Shipping Charge (₹)</div>
          <div></div>
        </div>

        <div className="space-y-3">
          {weightRanges.map((range) => (
            <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.3fr_1.3fr_1fr_40px] gap-3 md:gap-4 items-center">
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
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
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
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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

      {/* Important Notes */}
      <div className="rounded-xl bg-[#f4f7fa] p-5 sm:p-6 shadow-sm border border-slate-100">
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