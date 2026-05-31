"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Fish, Gauge, Sparkles, X, Info, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { CldUploadWidget } from 'next-cloudinary';
import { apiClient } from '@/lib/api-client';
import { FISH_NAMES } from '@/lib/catalog';

export default function VendorAddProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    pricingType: 'piece' as 'piece' | 'pair',
    unitPrice: '',
    category: 'Guppies',
    waterType: 'Freshwater',
    tag: 'Standard',
    scientific: '',
    originalPrice: '',
    discountPercentage: '',
    shippingPieceRanges: [
      { id: uuidv4(), pieceRange: '2 - 4 Pieces', estimatedQuantity: '~ 2 - 4 Pieces', charge: 60 as number | '' },
      { id: uuidv4(), pieceRange: '4 - 8 Pieces', estimatedQuantity: '~ 4 - 8 Pieces', charge: 80 },
      { id: uuidv4(), pieceRange: '8 - 10 Pieces', estimatedQuantity: '~ 8 - 10 Pieces', charge: 100 },
      { id: uuidv4(), pieceRange: '10 - 15 Pieces', estimatedQuantity: '~ 10 - 15 Pieces', charge: 120 },
      { id: uuidv4(), pieceRange: '15 - 20 Pieces', estimatedQuantity: '~ 15 - 20 Pieces', charge: 150 },
    ],
    shippingWeightRanges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 2 - 4 Pieces', charge: 60 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 4 - 6 Pieces', charge: 90 },
      { id: uuidv4(), weightRange: '1 - 1.5 KG', estimatedQuantity: '~ 6 - 8 Pieces', charge: 120 },
      { id: uuidv4(), weightRange: '1.5 - 2 KG', estimatedQuantity: '~ 8 - 12 Pieces', charge: 150 },
      { id: uuidv4(), weightRange: '2 - 3 KG', estimatedQuantity: '~ 12 - 20 Pieces', charge: 180 },
      { id: uuidv4(), weightRange: 'Above 3 KG', estimatedQuantity: '20+ Pieces', charge: 200 },
    ],
  });
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products';

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories', { cache: 'no-store' });
        if (!response.ok) return;

        const data = await response.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (FISH_NAMES.includes(form.title as any)) {
      const fetchDescription = async () => {
        try {
          const res = await fetch(`/api/fish-descriptions?name=${encodeURIComponent(form.title)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.description) {
              setForm(prev => ({ ...prev, description: data.description }));
            }
          }
        } catch (error) {
          console.error("Failed to fetch description", error);
        }
      };
      fetchDescription();
    }
  }, [form.title]);

  const removeImage = () => {
    setImageUrl('');
    setUploadError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    if (!imageUrl) {
      setUploadError('Please upload a product image before creating the product.');
      return;
    }

    try {
      setIsSaving(true);
      const unitPrice = Number(form.unitPrice);

      if (Number.isNaN(unitPrice) || unitPrice < 0) {
        setSubmitError('Please enter a valid unit price.');
        return;
      }

      await apiClient.createProduct({
        title: form.title,
        description: form.description,
        images: [imageUrl],
        price: unitPrice,
        category: form.category,
        waterType: form.waterType,
        tag: form.tag,
        scientific: form.scientific,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : undefined,
        perPiecePrice: form.pricingType === 'piece' ? Number(form.unitPrice) : null,
        perPairPrice: form.pricingType === 'pair' ? Number(form.unitPrice) : null,
        shippingPieceRanges: form.shippingPieceRanges,
        shippingWeightRanges: form.shippingWeightRanges,
      });
      router.push('/vendor/products');
    } catch (error: any) {
      setSubmitError(error?.message || 'Failed to create product. Please login again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-4xl bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100 mb-2">Inventory</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Add Product</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
              Add a new listing with faster product naming, clear pricing, and a cleaner publishing flow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <Fish className="h-5 w-5 text-blue-100" />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-blue-100">Fish names</p>
              <p className="mt-1 text-sm text-white">Autocomplete ready</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <Gauge className="h-5 w-5 text-blue-100" />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-blue-100">Shipping</p>
              <p className="mt-1 text-sm text-white">Per piece or weight</p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="rounded-4xl border border-blue-100 bg-white p-5 space-y-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <select
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            list="fish-name-autofill"
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Product title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <input
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Scientific name (optional)"
            value={form.scientific}
            onChange={(e) => setForm((prev) => ({ ...prev, scientific: e.target.value }))}
          />
          <select
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={form.pricingType}
            onChange={(e) => setForm((prev) => ({ ...prev, pricingType: e.target.value as 'piece' | 'pair' }))}
          >
            <option value="piece">Price per piece</option>
            <option value="pair">Price per pair</option>
          </select>
          <input
            type="number"
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={form.pricingType === 'piece' ? 'Per piece price' : 'Per pair price'}
            min={0}
            value={form.unitPrice}
            onChange={(e) => setForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
            required
          />
          <input
            type="number"
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Original price (optional)"
            min={0}
            value={form.originalPrice}
            onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
          />

          <input
            type="number"
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Discount % (optional)"
            min={0}
            max={100}
            value={form.discountPercentage}
            onChange={(e) => setForm((prev) => ({ ...prev, discountPercentage: e.target.value }))}
          />
          
          <CldUploadWidget
            uploadPreset={uploadPreset}
            options={{
              sources: ['local', 'camera', 'url'],
              multiple: false,
              resourceType: 'image',
            }}
            onOpen={() => {
              setUploadError('');
            }}
            onClose={() => {
              setIsUploading(false);
            }}
            onSuccess={(result: any) => {
              const info = result?.info;
              if (info && typeof info === 'object' && 'secure_url' in info) {
                setImageUrl(String(info.secure_url));
                setUploadError('');
              } else {
                setUploadError('Upload succeeded but image URL could not be read. Please try again.');
              }
              setIsUploading(false);
            }}
            onError={() => {
              setUploadError('Image upload failed. Please check your Cloudinary preset and try again.');
              setIsUploading(false);
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => {
                  setIsUploading(true);
                  open();
                }}
                className="h-11 px-4 rounded-xl border border-blue-200 border-dashed flex items-center cursor-pointer hover:bg-blue-50 transition-colors text-slate-600 font-medium"
              >
                {isUploading ? 'Uploading...' : imageUrl ? 'Replace Image' : 'Upload Image'}
              </button>
            )}
          </CldUploadWidget>

          <select
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={form.waterType}
            onChange={(e) => setForm((prev) => ({ ...prev, waterType: e.target.value }))}
          >
            <option value="Freshwater">Freshwater</option>
            <option value="Saltwater">Saltwater</option>
            <option value="Brackish">Brackish</option>
          </select>
        </div>

        {/* Section A: Pieces */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                A. Shipping Charges Per Number of Pieces <Info className="h-4 w-4 text-slate-400" />
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Set shipping charges based on the number of pieces.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setForm(prev => ({
                ...prev,
                shippingPieceRanges: [...prev.shippingPieceRanges, { id: uuidv4(), pieceRange: '', estimatedQuantity: '', charge: '' }]
              }))}
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-blue-600 hover:bg-slate-50 transition-colors shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Range
            </button>
          </div>

          <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_40px] gap-4 mb-3 px-2">
            <div className="text-sm font-bold text-slate-900">Pieces Range</div>
            <div className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
              Estimated Quantity <Info className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="text-sm font-bold text-slate-900">Shipping Charge (₹)</div>
            <div></div>
          </div>

          <div className="space-y-3">
            {form.shippingPieceRanges.map((range) => (
              <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_40px] gap-3 md:gap-4 items-center">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Pieces Range</label>
                  <input 
                    type="text" 
                    value={range.pieceRange}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      shippingPieceRanges: prev.shippingPieceRanges.map(r => r.id === range.id ? { ...r, pieceRange: e.target.value } : r)
                    }))}
                    placeholder="e.g. 2 - 4 Pieces"
                    className="w-full h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Estimated Quantity</label>
                  <input 
                    type="text" 
                    value={range.estimatedQuantity}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      shippingPieceRanges: prev.shippingPieceRanges.map(r => r.id === range.id ? { ...r, estimatedQuantity: e.target.value } : r)
                    }))}
                    placeholder="e.g. ~ 2 - 4 Shrimp"
                    className="w-full h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                  />
                </div>
                
                <div className="relative">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Shipping Charge</label>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium md:top-5.5 md:-mt-0.5">₹</span>
                  <input 
                    type="number" 
                    value={range.charge}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      shippingPieceRanges: prev.shippingPieceRanges.map(r => r.id === range.id ? { ...r, charge: e.target.value === '' ? '' : Number(e.target.value) } : r)
                    }))}
                    placeholder="0"
                    min="0"
                    className="w-full h-11 rounded-lg border border-slate-200 pl-8 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                  />
                </div>
                
                <div className="flex justify-end md:justify-center">
                  <button 
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      shippingPieceRanges: prev.shippingPieceRanges.filter(r => r.id !== range.id)
                    }))}
                    disabled={form.shippingPieceRanges.length === 1}
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
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                B. Shipping Charge Per Weight (KG) <Info className="h-4 w-4 text-slate-400" />
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Set shipping charges based on total weight of the shipment.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setForm(prev => ({
                ...prev,
                shippingWeightRanges: [...prev.shippingWeightRanges, { id: uuidv4(), weightRange: '', estimatedQuantity: '', charge: '' }]
              }))}
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-blue-600 hover:bg-slate-50 transition-colors shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Range
            </button>
          </div>

          <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_40px] gap-4 mb-3 px-2">
            <div className="text-sm font-bold text-slate-900">Weight Range</div>
            <div className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
              Estimated Quantity <Info className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="text-sm font-bold text-slate-900">Shipping Charge (₹)</div>
            <div></div>
          </div>

          <div className="space-y-3">
            {form.shippingWeightRanges.map((range) => (
              <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_40px] gap-3 md:gap-4 items-center">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Weight Range</label>
                  <input 
                    type="text" 
                    value={range.weightRange}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      shippingWeightRanges: prev.shippingWeightRanges.map(r => r.id === range.id ? { ...r, weightRange: e.target.value } : r)
                    }))}
                    placeholder="e.g. Up to 0.5 KG"
                    className="w-full h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Estimated Quantity</label>
                  <input 
                    type="text" 
                    value={range.estimatedQuantity}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      shippingWeightRanges: prev.shippingWeightRanges.map(r => r.id === range.id ? { ...r, estimatedQuantity: e.target.value } : r)
                    }))}
                    placeholder="e.g. ~ 2 - 4 Pieces"
                    className="w-full h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                  />
                </div>
                
                <div className="relative">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block md:hidden">Shipping Charge</label>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium md:top-5.5 md:-mt-0.5">₹</span>
                  <input 
                    type="number" 
                    value={range.charge}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      shippingWeightRanges: prev.shippingWeightRanges.map(r => r.id === range.id ? { ...r, charge: e.target.value === '' ? '' : Number(e.target.value) } : r)
                    }))}
                    placeholder="0"
                    min="0"
                    className="w-full h-11 rounded-lg border border-slate-200 pl-8 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                  />
                </div>
                
                <div className="flex justify-end md:justify-center">
                  <button 
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      shippingWeightRanges: prev.shippingWeightRanges.filter(r => r.id !== range.id)
                    }))}
                    disabled={form.shippingWeightRanges.length === 1}
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

        <datalist id="fish-name-autofill">
          {FISH_NAMES.map((fishName) => (
            <option key={fishName} value={fishName} />
          ))}
        </datalist>

        {uploadError && (
          <p className="text-sm text-rose-600 font-medium">{uploadError}</p>
        )}

        {submitError && (
          <p className="text-sm text-rose-600 font-medium">{submitError}</p>
        )}

        {imageUrl && (
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-blue-200 shadow-sm">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <textarea
          className="w-full min-h-28 px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          required
        />

        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Create Product'} <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
