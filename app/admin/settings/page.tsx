"use client";

import React, { useEffect, useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { Save, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    offerBadge: '',
    offerTitle: '',
    offerDescription: '',
    offerButtonText: '',
    offerButtonLink: '',
    shippingPerPiece: 0,
    shippingPerWeight: 0,
    categories: [] as string[],
    categoryImages: {} as Record<string, string>,
    stat1Value: '',
    stat1Label: '',
    stat2Value: '',
    stat2Label: '',
    stat3Value: '',
    stat3Label: '',
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const normalizeShippingValue = (value: number | string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...config,
        shippingPerPiece: normalizeShippingValue(config.shippingPerPiece),
        shippingPerWeight: normalizeShippingValue(config.shippingPerWeight),
      };

      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          Homepage <span className="text-blue-600">Settings</span>
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Offer and Shipping Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Customize the main promotional banner and the shipping charges shown during checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Badge Text</label>
              <input
                type="text"
                name="offerBadge"
                value={config.offerBadge}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Limited Time Offer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
              <textarea
                name="offerTitle"
                value={config.offerTitle}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="e.g. Save Up To 35% On\nPremium Aquatic Stock"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
              <textarea
                name="offerDescription"
                value={config.offerDescription}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Offer description text..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                name="offerButtonText"
                value={config.offerButtonText}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Shop The Offer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Button Link</label>
              <input
                type="text"
                name="offerButtonLink"
                value={config.offerButtonLink}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. /products"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Statistics Cards</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-1">Stat 1 Value</label>
              <input type="text" name="stat1Value" value={config.stat1Value} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              <label className="block text-sm font-bold text-gray-700 mb-1">Stat 1 Label</label>
              <input type="text" name="stat1Label" value={config.stat1Label} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-1">Stat 2 Value</label>
              <input type="text" name="stat2Value" value={config.stat2Value} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              <label className="block text-sm font-bold text-gray-700 mb-1">Stat 2 Label</label>
              <input type="text" name="stat2Label" value={config.stat2Label} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-1">Stat 3 Value</label>
              <input type="text" name="stat3Value" value={config.stat3Value} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              <label className="block text-sm font-bold text-gray-700 mb-1">Stat 3 Label</label>
              <input type="text" name="stat3Label" value={config.stat3Label} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Shipping Charges</h3>
          <p className="text-sm text-gray-500 mb-4">
            Set the base shipping charge for a single item and the weight-based charge used when a cart contains more than one unit.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-1">Shipping per Piece</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="shippingPerPiece"
                value={config.shippingPerPiece}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-2">Applied when the cart has a single unit.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-1">Shipping per Weight Unit</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="shippingPerWeight"
                value={config.shippingPerWeight}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-2">Applied to each unit when the cart has more than one item.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Categories</h3>

          <div className="space-y-4">
            {(config.categories || []).map((cat) => (
              <div key={cat} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="w-20 h-12 bg-white rounded-md overflow-hidden border">
                  {config.categoryImages && config.categoryImages[cat] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={config.categoryImages[cat]} alt={cat} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{cat}</div>
                </div>
                <div>
                  <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'} options={{ sources: ['local', 'camera', 'url'], multiple: false, resourceType: 'image' }} onSuccess={(result: any) => {
                    const secureUrl = result?.info?.secure_url;
                    if (secureUrl) {
                      setConfig((prev) => ({ ...(prev as any), categoryImages: { ...(prev as any).categoryImages, [cat]: String(secureUrl) } }));
                    }
                  }}>
                    {({ open }) => <button type="button" onClick={() => open()} className="h-9 px-3 rounded-md border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50">Upload</button>}
                  </CldUploadWidget>
                </div>
              </div>
            ))}

            <AddCategoryRow config={config} setConfig={setConfig} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddCategoryRow({ config, setConfig }: { config: any; setConfig: any }) {
  const [name, setName] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const addCategory = () => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    const existing = Array.isArray(config.categories) ? config.categories : [];
    if (existing.includes(trimmed)) {
      setName('');
      return;
    }
    const newCategories = [...existing, trimmed];
    const newImages = { ...(config.categoryImages || {}) };
    if (preview) newImages[trimmed] = preview;
    setConfig((prev: any) => ({ ...prev, categories: newCategories, categoryImages: newImages }));
    setName('');
    setPreview(null);
  };

  return (
    <div className="flex gap-3 items-center">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="px-3 py-2 border rounded-lg w-72" />
      <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'} options={{ sources: ['local', 'camera', 'url'], multiple: false, resourceType: 'image' }} onSuccess={(res: any) => {
        const url = res?.info?.secure_url;
        if (url) setPreview(String(url));
      }}>
        {({ open }) => <button type="button" onClick={() => open()} className="h-9 px-3 rounded-md border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50">Upload Image</button>}
      </CldUploadWidget>
      <button type="button" onClick={addCategory} className="h-9 px-4 rounded-md bg-blue-600 text-white font-semibold">Add</button>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="preview" className="w-12 h-8 object-cover rounded-md border" />
      ) : null}
    </div>
  );
}