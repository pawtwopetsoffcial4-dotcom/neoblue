"use client";

import React, { useEffect, useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { 
  Save, Loader2, Sparkles, X, Plus, Trash2, ArrowUp, ArrowDown, 
  Image as ImageIcon, Eye, ExternalLink, Layers, CheckCircle2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IHeroSlide, DEFAULT_HERO_SLIDES } from '@/lib/models/StoreConfig';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    offerBadge: '',
    offerTitle: '',
    offerDescription: '',
    offerButtonText: '',
    offerButtonLink: '',
    heroSlides: DEFAULT_HERO_SLIDES as IHeroSlide[],
    heroBgImage: '',
    categories: [] as string[],
    categoryImages: {} as Record<string, string>,
    stat1Value: '',
    stat1Label: '',
    stat2Value: '',
    stat2Label: '',
    stat3Value: '',
    stat3Label: '',
    subcategories: {} as Record<string, string[]>,
  });
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('authToken') ?? '';
        const [res, catRes] = await Promise.all([
          fetch('/api/config', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/categories')
        ]);
        
        if (res.ok) {
          const data = await res.json();
          setConfig({
            ...data,
            heroSlides: Array.isArray(data.heroSlides) && data.heroSlides.length > 0
              ? data.heroSlides
              : DEFAULT_HERO_SLIDES,
          });
        }

        if (catRes.ok) {
          const data = await catRes.json();
          if (data.categories) setAllCategories(data.categories);
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

  // Hero Slide Helpers
  const handleAddSlide = () => {
    const newSlide: IHeroSlide = {
      id: `slide-${Date.now()}`,
      badge: 'New Collection',
      title: 'New Featured Aquatic Banner',
      description: 'Explore the latest arrivals of healthy fishes & fresh plants.',
      buttonText: 'Shop Now',
      buttonLink: '/products',
      bgImage: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1600&q=80',
      mode: 'all',
    };
    setConfig((prev) => ({
      ...prev,
      heroSlides: [...(prev.heroSlides || []), newSlide],
    }));
    setActivePreviewIndex((config.heroSlides || []).length);
  };

  const handleRemoveSlide = (index: number) => {
    if ((config.heroSlides || []).length <= 1) {
      alert('You must have at least one hero slide.');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      heroSlides: (prev.heroSlides || []).filter((_, i) => i !== index),
    }));
    if (activePreviewIndex >= index && activePreviewIndex > 0) {
      setActivePreviewIndex(activePreviewIndex - 1);
    }
  };

  const handleSlideChange = (index: number, field: keyof IHeroSlide, value: string) => {
    setConfig((prev) => {
      const updatedSlides = [...(prev.heroSlides || [])];
      updatedSlides[index] = {
        ...updatedSlides[index],
        [field]: value,
      };
      return { ...prev, heroSlides: updatedSlides };
    });
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    setConfig((prev) => {
      const slides = [...(prev.heroSlides || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= slides.length) return prev;
      const temp = slides[index];
      slides[index] = slides[targetIndex];
      slides[targetIndex] = temp;
      return { ...prev, heroSlides: slides };
    });
    setActivePreviewIndex(direction === 'up' ? Math.max(0, index - 1) : Math.min((config.heroSlides || []).length - 1, index + 1));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...config };
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

  const currentPreviewSlide = (config.heroSlides || [])[activePreviewIndex] || (config.heroSlides || [])[0];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2">
            Homepage <span className="text-blue-600">Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage hero carousel, background images, and promotions.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Settings'}</span>
          <span className="sm:hidden">{saving ? '...' : 'Save'}</span>
        </button>
      </div>

      {/* 1. HERO CAROUSEL & BACKGROUND IMAGES SECTION */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-7 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Hero Header Carousel & Banners
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Add multiple rotating slides, change background photos, badges, and call-to-action buttons.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSlide}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Slide</span>
          </button>
        </div>

        {/* Live Slide Preview */}
        {currentPreviewSlide && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                Live Preview (Slide #{activePreviewIndex + 1})
              </span>
              <div className="flex items-center gap-1">
                {(config.heroSlides || []).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePreviewIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === activePreviewIndex ? 'w-5 bg-blue-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden shadow-md min-h-[220px] sm:min-h-[260px] flex items-center bg-slate-900 select-none">
              {currentPreviewSlide.bgImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPreviewSlide.bgImage}
                  alt={currentPreviewSlide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
              <div className="relative z-10 p-6 sm:p-8 max-w-xl">
                {currentPreviewSlide.badge && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold text-white uppercase tracking-wider mb-2">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>{currentPreviewSlide.badge}</span>
                  </div>
                )}
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
                  {currentPreviewSlide.title || 'Untitled Banner'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm font-medium mb-4 line-clamp-2">
                  {currentPreviewSlide.description || 'Slide description...'}
                </p>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                  <span>{currentPreviewSlide.buttonText || 'Shop Now'}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide Edit Cards List */}
        <div className="space-y-6">
          {(config.heroSlides || []).map((slide, index) => (
            <div 
              key={slide.id || index}
              className={`p-5 rounded-2xl border transition-all ${
                index === activePreviewIndex 
                  ? 'border-blue-300 bg-blue-50/20 shadow-xs' 
                  : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white font-black text-xs">
                    {index + 1}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">Slide #{index + 1}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    slide.mode === 'fishes' 
                      ? 'bg-blue-100 text-blue-700' 
                      : slide.mode === 'plants' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-200 text-slate-700'
                  }`}>
                    {slide.mode === 'fishes' ? 'Fishes Only' : slide.mode === 'plants' ? 'Plants Only' : 'All Modes'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActivePreviewIndex(index)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Preview Slide"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveSlide(index, 'up')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === (config.heroSlides || []).length - 1}
                    onClick={() => handleMoveSlide(index, 'down')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlide(index)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors ml-1"
                    title="Delete Slide"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Background Image Upload & Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Background Photo
                  </label>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {slide.bgImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.bgImage}
                        alt="Slide Background"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-[11px]">No image uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'}
                      options={{ sources: ['local', 'camera', 'url'], multiple: false, resourceType: 'image' }}
                      onSuccess={(result: any) => {
                        const secureUrl = result?.info?.secure_url;
                        if (secureUrl) {
                          handleSlideChange(index, 'bgImage', secureUrl);
                        }
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>Upload Image</span>
                        </button>
                      )}
                    </CldUploadWidget>

                    {slide.bgImage && (
                      <button
                        type="button"
                        onClick={() => handleSlideChange(index, 'bgImage', '')}
                        className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
                        title="Clear image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={slide.bgImage || ''}
                      onChange={(e) => handleSlideChange(index, 'bgImage', e.target.value)}
                      placeholder="Or paste image URL directly..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                {/* Content Inputs */}
                <div className="md:col-span-2 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Badge Text
                      </label>
                      <input
                        type="text"
                        value={slide.badge || ''}
                        onChange={(e) => handleSlideChange(index, 'badge', e.target.value)}
                        placeholder="e.g. Limited Time Offer"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Show In Mode
                      </label>
                      <select
                        value={slide.mode || 'all'}
                        onChange={(e) => handleSlideChange(index, 'mode', e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="all">All (Fishes & Plants)</option>
                        <option value="fishes">Fishes Mode Only</option>
                        <option value="plants">Plants Mode Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Main Headline / Title
                    </label>
                    <input
                      type="text"
                      value={slide.title || ''}
                      onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                      placeholder="e.g. Save Up to 35% on Premium Live Stock"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Subtext Description
                    </label>
                    <textarea
                      rows={2}
                      value={slide.description || ''}
                      onChange={(e) => handleSlideChange(index, 'description', e.target.value)}
                      placeholder="e.g. Handpicked freshwater & marine species with overnight transit care."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={slide.buttonText || ''}
                        onChange={(e) => handleSlideChange(index, 'buttonText', e.target.value)}
                        placeholder="e.g. Shop Now"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Button Link URL
                      </label>
                      <input
                        type="text"
                        value={slide.buttonLink || ''}
                        onChange={(e) => handleSlideChange(index, 'buttonLink', e.target.value)}
                        placeholder="e.g. /products or /categories/plants"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. PROMOTIONAL OFFER & STATS CONFIGURATION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            General Offer & Stats Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure fallback offer texts and trust statistics.
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
          <h3 className="text-lg font-bold text-gray-800 mb-4">Categories</h3>

          <div className="space-y-4">
            {Array.from(new Set([...(config.categories || []), ...allCategories])).sort().map((cat) => (
              <div key={cat} className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
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

                <div className="border-t border-gray-200 pt-3 mt-1">
                  <div className="text-sm font-bold text-gray-700 mb-2">Varieties / Names</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(config.subcategories?.[cat] || []).map(sub => (
                      <span key={sub} className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-sm">
                        {sub}
                        <button 
                          type="button"
                          onClick={() => {
                            setConfig(prev => {
                              const newSubs = { ...(prev as any).subcategories };
                              newSubs[cat] = (newSubs[cat] || []).filter((s: string) => s !== sub);
                              return { ...prev, subcategories: newSubs };
                            });
                          }} 
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {(!config.subcategories?.[cat] || config.subcategories[cat].length === 0) && (
                      <span className="text-xs text-gray-400 italic">No varieties added yet.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder={`New ${cat} name...`} 
                      className="px-3 py-1.5 border border-gray-200 rounded-md text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            setConfig(prev => {
                              const newSubs = { ...(prev as any).subcategories };
                              const catSubs = newSubs[cat] || [];
                              if (!catSubs.includes(val)) {
                                newSubs[cat] = [...catSubs, val];
                              }
                              return { ...prev, subcategories: newSubs };
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <span className="text-xs text-gray-400 font-medium">Press Enter to add</span>
                  </div>
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