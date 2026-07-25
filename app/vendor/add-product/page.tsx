"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Fish, Gauge, Sparkles, X, Info, Plus, Trash2, ChevronRight, ChevronLeft, Upload, Check, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { CldUploadWidget } from 'next-cloudinary';
import { apiClient } from '@/lib/api-client';
import { FISH_NAMES, getSubcategoriesForCategory, PRODUCT_CATEGORIES } from '@/lib/catalog';

export default function VendorAddProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingRegion, setShippingRegion] = useState<'North' | 'South'>('North');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [categories, setCategories] = useState<string[]>(PRODUCT_CATEGORIES as unknown as string[]);
  const [dbSubcategories, setDbSubcategories] = useState<Record<string, string[]>>({});
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [customVarietyMode, setCustomVarietyMode] = useState(false);
  const [faq, setFaq] = useState<Array<{ q: string; a: string }>>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    pricingType: 'piece' as 'piece' | 'pair',
    stockQuantity: '',
    size: '',
    ageCategory: 'adult',
    category: 'Guppies',
    waterType: 'Freshwater',
    tag: 'Standard',
    scientific: '',
    originalPrice: '',
    discountPercentage: '',
    deliverNorth: true,
    deliverSouth: true,
    phMin: '6.0',
    phMax: '8.0',
    tempMin: '20',
    tempMax: '30',
    temperament: 'Peaceful',
    weightPerPiece: 250,
    lightingRequirement: 'Medium',
    co2Requirement: 'Recommended',
    growthRate: 'Moderate',
    placement: 'Midground',
    careDifficulty: 'Moderate',
  });

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products';

  const getVarietiesForCategory = (cat: string) => {
    const configSubs = dbSubcategories[cat] || [];
    const staticSubs = getSubcategoriesForCategory(cat);
    return Array.from(new Set([...configSubs, ...staticSubs]));
  };

  const handleCategoryChange = (cat: string) => {
    const varieties = getVarietiesForCategory(cat);
    setForm((prev) => ({
      ...prev,
      category: cat,
      title: varieties.length > 0 ? varieties[0] : '',
    }));
  };

  const registerCustomCategoryAndVariety = async (category: string, variety: string) => {
    try {
      const config = await apiClient.request<{ categories?: string[]; subcategories?: Record<string, string[]> }>('/config');
      let updated = false;

      // Handle Category
      const currentCats = Array.isArray(config.categories) ? config.categories : [];
      let nextCats = [...currentCats];
      if (category && !currentCats.includes(category)) {
        nextCats.push(category);
        updated = true;
      }

      // Handle Variety
      const currentSubs = config.subcategories && typeof config.subcategories === 'object' ? config.subcategories : {};
      let nextSubs = { ...currentSubs };
      if (category && variety) {
        const categorySubs = Array.isArray(currentSubs[category]) ? currentSubs[category] : [];
        if (!categorySubs.includes(variety)) {
          nextSubs[category] = [...categorySubs, variety];
          updated = true;
        }
      }

      if (updated) {
        await apiClient.request('/config', {
          method: 'PUT',
          body: JSON.stringify({
            categories: nextCats,
            subcategories: nextSubs,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to register custom category/variety globally:', err);
    }
  };

  // Fetch dynamic categories from store config and merge with static catalog
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiClient.request<{ categories?: string[]; subcategories?: Record<string, string[]> }>('/config');
        const configCats = Array.isArray(data.categories) ? data.categories : [];
        const staticCats = PRODUCT_CATEGORIES as unknown as string[];
        // Merge both lists, deduplicate, preserve order
        const merged = Array.from(new Set([...configCats, ...staticCats]));
        setCategories(merged);
        setDbSubcategories(data.subcategories && typeof data.subcategories === 'object' ? data.subcategories : {});

        const defaultCat = merged.find(c => c === 'Guppies') || merged[0] || 'Guppies';
        const configSubs = data.subcategories?.[defaultCat] || [];
        const staticSubs = getSubcategoriesForCategory(defaultCat);
        const mergedSubs = Array.from(new Set([...configSubs, ...staticSubs]));
        setForm(prev => ({
          ...prev,
          category: defaultCat,
          title: mergedSubs.length > 0 ? mergedSubs[0] : ''
        }));
      } catch {
        // Fallback to static categories
        const defaultCat = (PRODUCT_CATEGORIES as unknown as string[]).find(c => c === 'Guppies') || PRODUCT_CATEGORIES[0];
        const varieties = getSubcategoriesForCategory(defaultCat);
        setForm(prev => ({
          ...prev,
          category: defaultCat,
          title: varieties.length > 0 ? varieties[0] : ''
        }));
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (form.title && FISH_NAMES.includes(form.title as any)) {
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

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setUploadError('');
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
    setUploadError('');
  };

  // Legacy range handlers removed

  const validateStep = (step: number) => {
    setSubmitError('');
    if (step === 1) {
      if (!form.category || !form.title) {
        setSubmitError('Category and Variety Title are required.');
        return false;
      }
    } else if (step === 2) {
      if (images.length === 0) {
        setUploadError('Please upload at least one product image before proceeding.');
        return false;
      }
      setUploadError('');
    } else if (step === 3) {
      const price = Number(form.price);
      if (form.price === '' || isNaN(price) || price < 0) {
        setSubmitError('Please enter a valid price.');
        return false;
      }
    } else if (step === 4) {
      const weight = Number(form.weightPerPiece);
      if (isNaN(weight) || weight <= 0) {
        setSubmitError('Please select a valid shipping weight.');
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(5, prev + 1));
    }
  };

  const prevStep = () => {
    setSubmitError('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    if (!form.description) {
      setSubmitError('Please enter a product description.');
      return;
    }

    try {
      setIsSaving(true);
      const price = Number(form.price);

      // Register custom category/variety globally if added
      await registerCustomCategoryAndVariety(form.category, form.title);

      await apiClient.createProduct({
        title: form.title,
        description: form.description,
        images: images,
        videos: videos,
        price: price,
        category: form.category,
        waterType: form.waterType,
        tag: form.tag,
        scientific: form.scientific,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : undefined,
        perPiecePrice: form.pricingType === 'piece' ? Number(form.price) : undefined,
        perPairPrice: form.pricingType === 'pair' ? Number(form.price) : undefined,
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : undefined,
        size: form.size,
        ageCategory: form.ageCategory,
        phMin: form.phMin ? Number(form.phMin) : undefined,
        phMax: form.phMax ? Number(form.phMax) : undefined,
        tempMin: form.tempMin ? Number(form.tempMin) : undefined,
        tempMax: form.tempMax ? Number(form.tempMax) : undefined,
        temperament: form.temperament,
        weightPerPiece: Number(form.weightPerPiece),
        deliverNorth: form.deliverNorth,
        deliverSouth: form.deliverSouth,
        faq: faq,
        ...(form.category === 'Plants' && {
          lightingRequirement: form.lightingRequirement,
          co2Requirement: form.co2Requirement,
          growthRate: form.growthRate,
          placement: form.placement,
          careDifficulty: form.careDifficulty,
        }),
      });
      router.push('/vendor/products');
    } catch (error: any) {
      setSubmitError(error?.message || 'Failed to create product. Please login again.');
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { number: 1, name: 'Basic Info' },
    { number: 2, name: 'Media' },
    { number: 3, name: 'Pricing' },
    { number: 4, name: 'Shipping' },
    { number: 5, name: 'Publish' },
  ];


  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 text-slate-800">
      {/* Page Header */}
      <section className="rounded-3xl bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-100 mb-2">Inventory Management</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Add New Product</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-50/90">
              Publish a premium variety with default catalog descriptions and configure regional shipping rates step-by-step.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-sm">
            <div className="rounded-xl bg-white/10 p-3 flex flex-col justify-between">
              <Fish className="h-5 w-5 text-blue-100" />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-blue-100">Autocomplete</p>
              <p className="mt-0.5 text-xs text-white font-medium">Auto-descriptions</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 flex flex-col justify-between">
              <Gauge className="h-5 w-5 text-blue-100" />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-blue-100">Shipping</p>
              <p className="mt-0.5 text-xs text-white font-medium">Regional charges</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stepper Wizard Indicator */}
      <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {steps.map((s, idx) => (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  onClick={() => validateStep(s.number - 1) && s.number < currentStep && setCurrentStep(s.number)}
                  disabled={s.number > currentStep}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${
                    currentStep === s.number
                      ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                      : currentStep > s.number
                      ? 'bg-emerald-500 border-emerald-500 text-white cursor-pointer'
                      : 'bg-white border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {currentStep > s.number ? <Check className="h-4 w-4" /> : s.number}
                </button>
                <span
                  className={`text-[9px] font-bold uppercase mt-2 tracking-wider ${
                    currentStep === s.number ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {s.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-5 transition-all duration-300 ${
                    currentStep > s.number ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/60 bg-white p-5 sm:p-6 shadow-xs space-y-6">
        
        {/* Error Banners */}
        {submitError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Error Occurred</p>
              <p className="text-xs font-semibold mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* STEP 1: BASIC INFO */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. Basic Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Select category, variety titles, scientific names, and stock details.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !customCategoryMode;
                      setCustomCategoryMode(next);
                      setForm(prev => ({ ...prev, category: next ? '' : (categories[0] || 'Guppies') }));
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {customCategoryMode ? "Or select category" : "Or enter custom"}
                  </button>
                </div>
                {customCategoryMode ? (
                  <input
                    type="text"
                    className="h-11 px-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white text-slate-900"
                    placeholder="Enter custom category name..."
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    required
                  />
                ) : (
                  <select
                    className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                    value={form.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Variety Title</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !customVarietyMode;
                      setCustomVarietyMode(next);
                      setForm(prev => ({ ...prev, title: next ? '' : (getVarietiesForCategory(form.category)[0] || '') }));
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {customVarietyMode ? "Or select variety" : "Or enter custom"}
                  </button>
                </div>
                {customVarietyMode ? (
                  <input
                    type="text"
                    className="h-11 px-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white text-slate-900"
                    placeholder="Enter custom variety name..."
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                ) : (
                  <select
                    className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Select variety</option>
                    {getVarietiesForCategory(form.category).map((variety) => (
                      <option key={variety} value={variety}>
                        {variety}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scientific Name (Optional)</label>
                <input
                  className="h-11 px-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  placeholder="e.g. Poecilia reticulata"
                  value={form.scientific}
                  onChange={(e) => setForm((prev) => ({ ...prev, scientific: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Water Type</label>
                <select
                  className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={form.waterType}
                  onChange={(e) => setForm((prev) => ({ ...prev, waterType: e.target.value }))}
                >
                  <option value="Freshwater">Freshwater</option>
                  <option value="Saltwater">Saltwater</option>
                  <option value="Brackish">Brackish</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Age Category</label>
                <select
                  className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={form.ageCategory}
                  onChange={(e) => setForm((prev) => ({ ...prev, ageCategory: e.target.value }))}
                >
                  <option value="adult">Adult</option>
                  <option value="semi-adult">Semi adult</option>
                  <option value="juvenile">Juvenile</option>
                  <option value="first-season-breeding-pair">First season breeding pair</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Size (e.g. 2 inches, Medium, 5 cm)</label>
                <input
                  type="text"
                  className="h-11 px-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  placeholder="e.g. 2 inches, Medium, 5 cm"
                  value={form.size}
                  onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity in Stock</label>
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  placeholder="0"
                  min={0}
                  value={form.stockQuantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ideal Min pH</label>
                <input
                  type="number"
                  step="0.1"
                  className="h-11 px-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  placeholder="6.0"
                  value={form.phMin}
                  onChange={(e) => setForm((prev) => ({ ...prev, phMin: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ideal Max pH</label>
                <input
                  type="number"
                  step="0.1"
                  className="h-11 px-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  placeholder="8.0"
                  value={form.phMax}
                  onChange={(e) => setForm((prev) => ({ ...prev, phMax: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ideal Min Temp (°C)</label>
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  placeholder="20"
                  value={form.tempMin}
                  onChange={(e) => setForm((prev) => ({ ...prev, tempMin: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ideal Max Temp (°C)</label>
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  placeholder="30"
                  value={form.tempMax}
                  onChange={(e) => setForm((prev) => ({ ...prev, tempMax: e.target.value }))}
                />
              </div>

              {form.category === 'Plants' ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lighting</label>
                    <select
                      className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                      value={form.lightingRequirement}
                      onChange={(e) => setForm((prev) => ({ ...prev, lightingRequirement: e.target.value as any }))}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CO2</label>
                    <select
                      className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                      value={form.co2Requirement}
                      onChange={(e) => setForm((prev) => ({ ...prev, co2Requirement: e.target.value as any }))}
                    >
                      <option value="None">None</option>
                      <option value="Recommended">Recommended</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Placement</label>
                    <select
                      className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                      value={form.placement}
                      onChange={(e) => setForm((prev) => ({ ...prev, placement: e.target.value as any }))}
                    >
                      <option value="Foreground">Foreground</option>
                      <option value="Midground">Midground</option>
                      <option value="Background">Background</option>
                      <option value="Floating">Floating</option>
                      <option value="Epiphyte">Epiphyte</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Social Temperament</label>
                  <select
                    className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                    value={form.temperament}
                    onChange={(e) => setForm((prev) => ({ ...prev, temperament: e.target.value }))}
                  >
                    <option value="Peaceful">Peaceful</option>
                    <option value="Semi-aggressive">Semi-aggressive</option>
                    <option value="Aggressive">Aggressive</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: MEDIA */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Product Media Upload</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload high-resolution pictures and videos of the aquatic specimen.</p>
            </div>

            {/* Images Upload Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700">Pictures (Min 1, Max 5)</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-xs group bg-slate-50">
                    <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md border border-white opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {images.length < 5 && (
                  <CldUploadWidget
                    uploadPreset={uploadPreset}
                    options={{
                      sources: ['local', 'camera', 'url'],
                      multiple: true,
                      resourceType: 'image',
                      cropping: true,
                      croppingAspectRatio: 1,
                      showSkipCropButton: true,
                    }}
                    onOpen={() => setUploadError('')}
                    onClose={() => setIsUploading(false)}
                    onSuccess={(result: any) => {
                      const info = result?.info;
                      if (info && typeof info === 'object' && 'secure_url' in info) {
                        let url = String(info.secure_url);
                        if (url.includes('/upload/')) {
                          url = url.replace('/upload/', '/upload/c_crop,g_custom/');
                        }
                        setImages((prev) => [...prev, url]);
                        setUploadError('');
                      } else {
                        setUploadError('Upload succeeded but secure URL could not be retrieved.');
                      }
                      setIsUploading(false);
                    }}
                    onError={() => {
                      setUploadError('Image upload failed. Please verify Cloudinary configuration.');
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
                        className="aspect-square border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Plus className="h-6 w-6 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">Add Picture</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>
            </div>

            {/* Videos Upload Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-700">Videos (Optional, Max 2)</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {videos.map((vid, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-xs group bg-slate-50">
                    <video src={vid} className="w-full h-full object-cover" muted playsInline loop />
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md border border-white opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {videos.length < 2 && (
                  <CldUploadWidget
                    uploadPreset={uploadPreset}
                    options={{
                      sources: ['local', 'url'],
                      multiple: false,
                      resourceType: 'video',
                    }}
                    onOpen={() => setUploadError('')}
                    onClose={() => setIsUploading(false)}
                    onSuccess={(result: any) => {
                      const info = result?.info;
                      if (info && typeof info === 'object' && 'secure_url' in info) {
                        let url = String(info.secure_url);
                        setVideos((prev) => [...prev, url]);
                        setUploadError('');
                      } else {
                        setUploadError('Upload succeeded but secure URL could not be retrieved.');
                      }
                      setIsUploading(false);
                    }}
                    onError={() => {
                      setUploadError('Video upload failed. Please verify Cloudinary configuration.');
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
                        className="aspect-square border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Plus className="h-6 w-6 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">Add Video</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-rose-500 font-bold mt-2">{uploadError}</p>
            )}
          </div>
        )}

        {/* STEP 3: PRICING */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-900">3. Pricing Configuration</h2>
              <p className="text-xs text-slate-500 mt-0.5">Specify active unit price, standard retail price, and discount tiers.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing Unit</label>
                <div className="inline-flex rounded-xl bg-slate-100 p-0.5 shadow-2xs border border-slate-200/50 h-11">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, pricingType: 'piece' }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${
                      form.pricingType === 'piece'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🪙 Per Piece
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, pricingType: 'pair' }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${
                      form.pricingType === 'pair'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👥 Per Pair
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Sale Price ({form.pricingType === 'piece' ? '₹ / Piece' : '₹ / Pair'})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                  <input
                    type="number"
                    className="w-full h-11 pl-8 pr-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    placeholder={form.pricingType === 'piece' ? 'Price per piece' : 'Price per pair'}
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: SHIPPING CONFIG */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-900">4. Shipping Setup</h2>
              <p className="text-xs text-slate-500 mt-0.5">Specify the shipping weight per piece for this variety.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weight Per Piece</label>
                <p className="text-xs text-slate-400">
                  Select the average shipping weight of a single piece (including water, package insulation, and container).
                </p>
                <div className="relative mt-2">
                  <select 
                    value={form.weightPerPiece}
                    onChange={(e) => setForm(prev => ({ ...prev, weightPerPiece: Number(e.target.value) }))}
                    className="w-full h-11 appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-semibold outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {[50, 75, 100, 120, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000].map((w) => (
                      <option key={w} value={w}>
                        {w >= 1000 ? `${w / 1000} kg (${w} gm)` : `${w} gm`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-4 flex items-start gap-2.5 mt-4">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 leading-relaxed font-semibold">
                  <strong>Automatic Shipping Charge:</strong> NeoBlue will dynamically aggregate weights at checkout, map them to your configured regional weight slabs (South/North India), and charge the buyer automatically. Make sure your global shipping rates are set up in your Settings.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: DESCRIPTION & REVIEW */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-900">5. Description & Review</h2>
              <p className="text-xs text-slate-500 mt-0.5">Write a descriptive copy and verify product details before publishing.</p>
            </div>

            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
              <textarea
                className="w-full min-h-24 px-4 py-3 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                placeholder="Describe variety characteristics, care instructions, and acclimation suggestions..."
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            {/* Q&A / FAQ Section */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  ❓ Product Q&A / FAQ Section
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Type custom questions and answers to show directly on this product page.</p>
              </div>

              {faq.length > 0 && (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {faq.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-bold text-slate-800">Q: {item.q}</p>
                        <p className="text-slate-600 mt-0.5">A: {item.a}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFaq(prev => prev.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer shrink-0 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Question (e.g. Is this shrimp community-safe?)"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Answer (e.g. Yes, they do great with small, peaceful fish...)"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={2}
                  className="p-3 rounded-lg border border-slate-200 outline-none text-xs focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newQuestion.trim() && newAnswer.trim()) {
                      setFaq(prev => [...prev, { q: newQuestion.trim(), a: newAnswer.trim() }]);
                      setNewQuestion('');
                      setNewAnswer('');
                    }
                  }}
                  className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5 transition-colors self-end"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Q&A Item
                </button>
              </div>
            </div>

            {/* Final Review Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                📋 Variety Summary Review
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Category</p>
                  <p className="text-slate-900 font-semibold mt-0.5">{form.category}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Variety Title</p>
                  <p className="text-slate-900 font-semibold mt-0.5 truncate">{form.title}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Water Type</p>
                  <p className="text-slate-900 font-semibold mt-0.5">{form.waterType}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Age Category</p>
                  <p className="text-slate-900 font-semibold mt-0.5 capitalize">{form.ageCategory}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Size</p>
                  <p className="text-slate-900 font-semibold mt-0.5">{form.size || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Listing Price</p>
                  <p className="text-slate-900 font-bold mt-0.5">
                    ₹{Number(form.price || 0).toFixed(2)} per {form.pricingType === 'piece' ? 'piece' : 'pair'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">In Stock</p>
                  <p className="text-slate-900 font-semibold mt-0.5">{form.stockQuantity || '0'} available</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Scientific Name</p>
                  <p className="text-slate-900 font-semibold mt-0.5 italic">{form.scientific || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-6 font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-7 font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              {isSaving ? 'Saving...' : 'Create & Publish'} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

      </form>
    </div>
  );
}

interface WeightRangeSliderProps {
  value: string;
  onChange: (value: string) => void;
}

function WeightRangeSlider({ value, onChange }: WeightRangeSliderProps) {
  const parseWeightRange = (str: string) => {
    const clean = (str || '').toLowerCase().trim();
    if (!clean) return { min: 0, max: 1, hasMax: true };

    if (clean.startsWith('up to')) {
      const match = clean.match(/up to\s+([\d.]+)/);
      const val = match ? parseFloat(match[1]) : 1;
      return { min: 0, max: isNaN(val) ? 1 : val, hasMax: true };
    }

    if (clean.startsWith('above')) {
      const match = clean.match(/above\s+([\d.]+)/);
      const val = match ? parseFloat(match[1]) : 3;
      return { min: isNaN(val) ? 3 : val, max: 100, hasMax: false };
    }

    const parts = clean.split('-');
    if (parts.length === 2) {
      const minVal = parseFloat(parts[0]);
      const maxVal = parseFloat(parts[1]);
      return {
        min: isNaN(minVal) ? 0 : minVal,
        max: isNaN(maxVal) ? 100 : maxVal,
        hasMax: true
      };
    }

    const matchNum = clean.match(/([\d.]+)/);
    const val = matchNum ? parseFloat(matchNum[1]) : 1;
    return { min: 0, max: isNaN(val) ? 1 : val, hasMax: true };
  };

  const formatWeightRange = (min: number, max: number, hasMax: boolean): string => {
    if (min === 0 && hasMax) {
      return `Up to ${max} KG`;
    }
    if (!hasMax) {
      return `Above ${min} KG`;
    }
    return `${min} - ${max} KG`;
  };

  const { min, max, hasMax } = parseWeightRange(value);

  const handleMinChange = (newMin: number) => {
    let newMax = max;
    if (newMin > max) {
      newMax = newMin;
    }
    onChange(formatWeightRange(newMin, newMax, hasMax));
  };

  const handleMaxChange = (newMax: number) => {
    let newMin = min;
    if (newMax < min) {
      newMin = newMax;
    }
    onChange(formatWeightRange(newMin, newMax, hasMax));
  };

  const handleToggleHasMax = () => {
    onChange(formatWeightRange(min, max, !hasMax));
  };

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/60 shadow-2xs w-full text-slate-800">
      <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-700">
        <span className="truncate bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100/50">
          {value || '0 - 1 KG'}
        </span>
        <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none">
          <input
            type="checkbox"
            checked={!hasMax}
            onChange={handleToggleHasMax}
            className="h-3.5 w-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">No Max Limit</span>
        </label>
      </div>

      <div className="space-y-1.5 pt-0.5">
        {/* Min weight slider */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Min Weight</span>
            <span className="text-slate-600 font-semibold">{min} KG</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={min}
            onChange={(e) => handleMinChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
          />
        </div>

        {/* Max weight slider */}
        {hasMax && (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Max Weight</span>
              <span className="text-slate-600 font-semibold">{max} KG</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="100"
              step="0.5"
              value={max}
              onChange={(e) => handleMaxChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
