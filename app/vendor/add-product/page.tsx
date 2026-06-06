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
    price: '',
    stockQuantity: '',
    ageCategory: 'adult',
    category: 'Guppies',
    waterType: 'Freshwater',
    tag: 'Standard',
    scientific: '',
    originalPrice: '',
    discountPercentage: '',
    shippingNorthSmallRanges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 60 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 90 },
    ],
    shippingNorthBulkRanges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 3 - 5 Pieces', charge: 80 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 4 - 6 Pieces', charge: 110 },
      { id: uuidv4(), weightRange: '1 - 1.5 KG', estimatedQuantity: '~ 6 - 8 Pieces', charge: 140 },
      { id: uuidv4(), weightRange: '1.5 - 2 KG', estimatedQuantity: '~ 8 - 12 Pieces', charge: 170 },
      { id: uuidv4(), weightRange: '2 - 3 KG', estimatedQuantity: '~ 12 - 20 Pieces', charge: 200 },
      { id: uuidv4(), weightRange: 'Above 3 KG', estimatedQuantity: '20+ Pieces', charge: 250 },
    ],
    shippingSouthSmallRanges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 100 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 140 },
    ],
    shippingSouthBulkRanges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 3 - 5 Pieces', charge: 120 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 4 - 6 Pieces', charge: 160 },
      { id: uuidv4(), weightRange: '1 - 1.5 KG', estimatedQuantity: '~ 6 - 8 Pieces', charge: 200 },
      { id: uuidv4(), weightRange: '1.5 - 2 KG', estimatedQuantity: '~ 8 - 12 Pieces', charge: 240 },
      { id: uuidv4(), weightRange: '2 - 3 KG', estimatedQuantity: '~ 12 - 20 Pieces', charge: 280 },
      { id: uuidv4(), weightRange: 'Above 3 KG', estimatedQuantity: '20+ Pieces', charge: 350 },
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
      const price = Number(form.price);

      if (Number.isNaN(price) || price < 0) {
        setSubmitError('Please enter a valid price.');
        return;
      }

      await apiClient.createProduct({
        title: form.title,
        description: form.description,
        images: [imageUrl],
        price: price,
        category: form.category,
        waterType: form.waterType,
        tag: form.tag,
        scientific: form.scientific,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : undefined,
        perPiecePrice: Number(form.price),
        perPairPrice: null,
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : undefined,
        ageCategory: form.ageCategory,
        shippingNorthSmallRanges: form.shippingNorthSmallRanges,
        shippingNorthBulkRanges: form.shippingNorthBulkRanges,
        shippingSouthSmallRanges: form.shippingSouthSmallRanges,
        shippingSouthBulkRanges: form.shippingSouthBulkRanges,
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
          <input
            type="number"
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Price"
            min={0}
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            required
          />

          <input
            type="number"
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Quantity in stock"
            min={0}
            value={form.stockQuantity}
            onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
          />

          <select
            className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={form.ageCategory}
            onChange={(e) => setForm((prev) => ({ ...prev, ageCategory: e.target.value }))}
          >
            <option value="adult">Adult</option>
            <option value="semi-adult">Semi adult</option>
            <option value="first-season-breeding-pair">First season breeding pair</option>
          </select>
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

        {/* Shipping info note */}
        <div className="rounded-lg bg-[#f0f4fa] p-3 border border-blue-100 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-blue-800">
            Tip: You can configure detailed North/South India shipping charges in Settings after creating the product.
          </p>
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
