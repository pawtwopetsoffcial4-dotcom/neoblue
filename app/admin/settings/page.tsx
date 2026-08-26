"use client";

import React, { useEffect, useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { 
  Save, Loader2, Sparkles, X, Plus, Trash2, ArrowUp, ArrowDown, 
  Image as ImageIcon, Eye, ExternalLink, Layers, Fish, Leaf, Link2, Palette
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  IHeroSlide, 
  IHeroButton, 
  DEFAULT_FISHES_HERO_SLIDES, 
  DEFAULT_PLANTS_HERO_SLIDES, 
  DEFAULT_HERO_SLIDES 
} from '@/lib/types/config';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'fishes' | 'plants'>('fishes');
  
  const [config, setConfig] = useState({
    offerBadge: '',
    offerTitle: '',
    offerDescription: '',
    offerButtonText: '',
    offerButtonLink: '',
    heroSlidesFishes: DEFAULT_FISHES_HERO_SLIDES as IHeroSlide[],
    heroSlidesPlants: DEFAULT_PLANTS_HERO_SLIDES as IHeroSlide[],
    heroSlides: DEFAULT_HERO_SLIDES as IHeroSlide[],
    heroBgImage: '',
    facebookPixelId: '1689531238818724',
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
            heroSlidesFishes: Array.isArray(data.heroSlidesFishes) && data.heroSlidesFishes.length > 0
              ? data.heroSlidesFishes
              : DEFAULT_FISHES_HERO_SLIDES,
            heroSlidesPlants: Array.isArray(data.heroSlidesPlants) && data.heroSlidesPlants.length > 0
              ? data.heroSlidesPlants
              : DEFAULT_PLANTS_HERO_SLIDES,
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

  // Active slides list based on activeTab
  const currentSlides = activeTab === 'fishes' 
    ? (config.heroSlidesFishes || []) 
    : (config.heroSlidesPlants || []);

  const setTargetSlides = (updater: (slides: IHeroSlide[]) => IHeroSlide[]) => {
    if (activeTab === 'fishes') {
      setConfig((prev) => ({
        ...prev,
        heroSlidesFishes: updater(prev.heroSlidesFishes || []),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        heroSlidesPlants: updater(prev.heroSlidesPlants || []),
      }));
    }
  };

  // Hero Slide Helpers
  const handleAddSlide = () => {
    const isFishes = activeTab === 'fishes';
    const newSlide: IHeroSlide = {
      id: `${activeTab}-slide-${Date.now()}`,
      badge: isFishes ? 'New Livestock' : 'Fresh Aquatic Flora',
      title: isFishes ? 'Exotic Live Fish Collection' : 'Vibrant Snail-Free Aquascape Plants',
      description: isFishes 
        ? 'Explore healthy handpicked freshwater fish with live arrival guarantee.' 
        : 'Transform your aquarium with lush nursery-grown aquatic plants.',
      buttonText: isFishes ? 'Shop Fish' : 'Browse Plants',
      buttonLink: isFishes ? '/products' : '/categories/plants',
      buttons: [
        { 
          id: `btn-${Date.now()}-1`, 
          text: isFishes ? 'Shop Fish' : 'Browse Plants', 
          link: isFishes ? '/products' : '/categories/plants', 
          variant: 'primary' 
        },
      ],
      bgImage: isFishes 
        ? 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1600&q=80'
        : 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=1600&q=80',
      mode: activeTab,
    };

    setTargetSlides((slides) => [...slides, newSlide]);
    setActivePreviewIndex(currentSlides.length);
  };

  const handleRemoveSlide = (index: number) => {
    if (currentSlides.length <= 1) {
      alert('You must keep at least one slide for this mode.');
      return;
    }
    setTargetSlides((slides) => slides.filter((_, i) => i !== index));
    if (activePreviewIndex >= index && activePreviewIndex > 0) {
      setActivePreviewIndex(activePreviewIndex - 1);
    }
  };

  const handleSlideChange = (index: number, field: keyof IHeroSlide, value: any) => {
    setTargetSlides((slides) => {
      const updated = [...slides];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    setTargetSlides((slides) => {
      const updated = [...slides];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return updated;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
    setActivePreviewIndex(direction === 'up' ? Math.max(0, index - 1) : Math.min(currentSlides.length - 1, index + 1));
  };

  // Button management inside slide
  const handleAddButton = (slideIndex: number) => {
    setTargetSlides((slides) => {
      const updated = [...slides];
      const slide = updated[slideIndex];
      const existingButtons = Array.isArray(slide.buttons) ? slide.buttons : [];
      const newBtn: IHeroButton = {
        id: `btn-${Date.now()}`,
        text: 'Learn More',
        link: '/products',
        variant: existingButtons.length === 0 ? 'primary' : 'glass',
      };
      updated[slideIndex] = {
        ...slide,
        buttons: [...existingButtons, newBtn],
      };
      return updated;
    });
  };

  const handleUpdateButton = (slideIndex: number, btnIndex: number, field: keyof IHeroButton, value: string) => {
    setTargetSlides((slides) => {
      const updated = [...slides];
      const slide = updated[slideIndex];
      const existingButtons = Array.isArray(slide.buttons) && slide.buttons.length > 0
        ? [...slide.buttons]
        : [{ id: 'btn-default', text: slide.buttonText || 'Shop Now', link: slide.buttonLink || '/products', variant: 'primary' as const }];
      
      existingButtons[btnIndex] = {
        ...existingButtons[btnIndex],
        [field]: value,
      };

      updated[slideIndex] = {
        ...slide,
        buttons: existingButtons,
      };
      return updated;
    });
  };

  const handleRemoveButton = (slideIndex: number, btnIndex: number) => {
    setTargetSlides((slides) => {
      const updated = [...slides];
      const slide = updated[slideIndex];
      const existingButtons = Array.isArray(slide.buttons) ? slide.buttons : [];
      if (existingButtons.length <= 1) {
        alert('Each slide should have at least one button.');
        return updated;
      }
      updated[slideIndex] = {
        ...slide,
        buttons: existingButtons.filter((_, i) => i !== btnIndex),
      };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...config,
        heroSlides: [
          ...(config.heroSlidesFishes || []),
          ...(config.heroSlidesPlants || []),
        ],
      };
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
        alert('Homepage & Carousel settings saved successfully!');
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

  const currentPreviewSlide = currentSlides[activePreviewIndex] || currentSlides[0];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2">
            Homepage <span className="text-blue-600">Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure mode-isolated carousels, custom slides, background images, and action buttons.
          </p>
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

      {/* 1. HERO CAROUSEL SETTINGS WITH MODE TABS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Hero Header Carousels
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Customize separate carousels for Fishes mode and Plants mode with unlimited slides & buttons.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSlide}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add {activeTab === 'fishes' ? 'Fish' : 'Plant'} Slide</span>
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-3 mb-6 p-1.5 bg-slate-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => {
              setActiveTab('fishes');
              setActivePreviewIndex(0);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'fishes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Fish className="h-4 w-4" />
            <span>Fishes Carousel ({(config.heroSlidesFishes || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('plants');
              setActivePreviewIndex(0);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'plants'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Leaf className="h-4 w-4" />
            <span>Plants Carousel ({(config.heroSlidesPlants || []).length})</span>
          </button>
        </div>

        {/* Live Slide Preview */}
        {currentPreviewSlide && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                Live Preview: {activeTab === 'fishes' ? '🐟 Fishes Slide' : '🌿 Plants Slide'} #{activePreviewIndex + 1}
              </span>
              <div className="flex items-center gap-1">
                {currentSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePreviewIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activePreviewIndex 
                        ? activeTab === 'fishes' ? 'w-5 bg-blue-600' : 'w-5 bg-emerald-600'
                        : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden shadow-md min-h-[220px] sm:min-h-[270px] flex items-center bg-slate-900 select-none">
              {currentPreviewSlide.bgImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPreviewSlide.bgImage}
                  alt={currentPreviewSlide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className={`absolute inset-0 ${
                  activeTab === 'fishes'
                    ? 'bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950'
                    : 'bg-gradient-to-br from-emerald-800 via-green-800 to-teal-950'
                }`} />
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
                <div className="flex flex-wrap items-center gap-2">
                  {(Array.isArray(currentPreviewSlide.buttons) && currentPreviewSlide.buttons.length > 0
                    ? currentPreviewSlide.buttons
                    : [{ text: currentPreviewSlide.buttonText || 'Shop Now', link: currentPreviewSlide.buttonLink || '/products', variant: 'primary' as const }]
                  ).map((btn, bIdx) => (
                    <div 
                      key={btn.id || bIdx}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                        btn.variant === 'secondary'
                          ? 'bg-white text-slate-900'
                          : btn.variant === 'glass'
                            ? 'bg-white/20 backdrop-blur-md text-white border border-white/30'
                            : activeTab === 'fishes' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <span>{btn.text || 'Shop Now'}</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide Edit Cards List */}
        <div className="space-y-6">
          {currentSlides.map((slide, index) => {
            const slideButtons = Array.isArray(slide.buttons) && slide.buttons.length > 0
              ? slide.buttons
              : [{ id: 'btn-1', text: slide.buttonText || 'Shop Now', link: slide.buttonLink || '/products', variant: 'primary' as const }];

            return (
              <div 
                key={slide.id || index}
                className={`p-5 rounded-2xl border transition-all ${
                  index === activePreviewIndex 
                    ? activeTab === 'fishes' ? 'border-blue-300 bg-blue-50/20 shadow-xs' : 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-4 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center justify-center h-6 w-6 rounded-full text-white font-black text-xs ${
                      activeTab === 'fishes' ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {activeTab === 'fishes' ? 'Fish Slide' : 'Plant Slide'} #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActivePreviewIndex(index)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Preview Slide"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveSlide(index, 'up')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === currentSlides.length - 1}
                      onClick={() => handleMoveSlide(index, 'down')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlide(index)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
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
                          className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
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
                  <div className="md:col-span-2 space-y-4">
                    <div>
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

                    {/* Multi-Button Manager */}
                    <div className="border-t border-slate-200/80 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Link2 className="h-3.5 w-3.5 text-blue-600" />
                          Slide Action Buttons ({slideButtons.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddButton(index)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Button</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {slideButtons.map((btn, bIdx) => (
                          <div 
                            key={btn.id || bIdx}
                            className="p-2.5 rounded-xl bg-white border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                          >
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                value={btn.text}
                                onChange={(e) => handleUpdateButton(index, bIdx, 'text', e.target.value)}
                                placeholder="Button Label (e.g. Shop Now)"
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                value={btn.link}
                                onChange={(e) => handleUpdateButton(index, bIdx, 'link', e.target.value)}
                                placeholder="URL (e.g. /products)"
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <select
                                value={btn.variant || 'primary'}
                                onChange={(e) => handleUpdateButton(index, bIdx, 'variant', e.target.value as any)}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="primary">Primary Solid</option>
                                <option value="secondary">Secondary Light</option>
                                <option value="glass">Glass Translucent</option>
                              </select>
                            </div>

                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                disabled={slideButtons.length <= 1}
                                onClick={() => handleRemoveButton(index, bIdx)}
                                className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 transition-colors cursor-pointer"
                                title="Remove button"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. META / FACEBOOK PIXEL TRACKING CONFIGURATION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="mb-5 border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-black">f</span>
              Meta / Facebook Pixel Tracking
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tracks visitor PageViews, product ViewContent with categories, AddToCart, and Purchases for Meta Ads Manager.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            ● Active
          </span>
        </div>

        <div className="max-w-xl space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Meta Pixel ID
            </label>
            <input
              type="text"
              name="facebookPixelId"
              value={config.facebookPixelId || ''}
              onChange={handleChange}
              placeholder="e.g. 1689531238818724"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            All product categories (e.g. <em>Plants</em>, <em>Freshwater Fish</em>, <em>Discus</em>, <em>Cichlids</em>) and e-commerce events are automatically sent to this Pixel ID in real-time.
          </p>
        </div>
      </div>

      {/* 3. PROMOTIONAL OFFER & STATS CONFIGURATION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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