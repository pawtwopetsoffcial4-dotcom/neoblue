"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { apiClient } from '@/lib/api-client';

export default function VendorAddProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Guppies',
    waterType: 'Freshwater',
    tag: 'Standard',
    scientific: '',
  });
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products';

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
      await apiClient.createProduct({
        title: form.title,
        description: form.description,
        price: Number(form.price),
        images: [imageUrl],
        category: form.category,
        waterType: form.waterType,
        tag: form.tag,
        scientific: form.scientific,
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
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Inventory</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Add Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-blue-100 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
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
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          >
            <option value="Guppies">Guppies</option>
            <option value="Betta">Betta</option>
            <option value="Angel's">Angel's</option>
            <option value="Discuss">Discuss</option>
            <option value="Platy">Platy</option>
            <option value="Exotic Molly">Exotic Molly</option>
            <option value="Zebra">Zebra</option>
          </select>

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

        {uploadError && (
          <p className="text-sm text-rose-600 font-medium">{uploadError}</p>
        )}

        {submitError && (
          <p className="text-sm text-rose-600 font-medium">{submitError}</p>
        )}

        {imageUrl && (
          <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-blue-200 shadow-sm">
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
          className="h-11 px-6 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
