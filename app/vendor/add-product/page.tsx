"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Fish, Gauge, Sparkles, X, Info, Plus, Trash2, ChevronRight, ChevronLeft, Upload, Check, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { CldUploadWidget } from 'next-cloudinary';
import { apiClient } from '@/lib/api-client';
import { FISH_NAMES, getSubcategoriesForCategory } from '@/lib/catalog';

export default function VendorAddProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingRegion, setShippingRegion] = useState<'North' | 'South'>('North');
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
    pricingType: 'piece' as 'piece' | 'pair',
    stockQuantity: '',
    ageCategory: 'adult',
    category: 'Guppies',
    waterType: 'Freshwater',
    tag: 'Standard',
    scientific: '',
    originalPrice: '',
    discountPercentage: '',
    shippingNorth1Ranges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 60 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 90 },
    ],
    shippingNorth2Ranges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 3 - 5 Pieces', charge: 80 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 4 - 6 Pieces', charge: 110 },
    ],
    shippingNorth3Ranges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 6 - 8 Pieces', charge: 120 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 8 - 10 Pieces', charge: 150 },
    ],
    shippingNorth4Ranges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 10+ Pieces', charge: 160 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 12+ Pieces', charge: 200 },
    ],
    shippingSouth1Ranges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 100 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 1 - 2 Pieces', charge: 140 },
    ],
    shippingSouth2Ranges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 3 - 5 Pieces', charge: 130 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 4 - 6 Pieces', charge: 170 },
    ],
    shippingSouth3Ranges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 6 - 8 Pieces', charge: 180 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 8 - 10 Pieces', charge: 220 },
    ],
    shippingSouth4Ranges: [
      { id: uuidv4(), weightRange: 'Up to 0.5 KG', estimatedQuantity: '~ 10+ Pieces', charge: 240 as number | '' },
      { id: uuidv4(), weightRange: '0.5 - 1 KG', estimatedQuantity: '~ 12+ Pieces', charge: 300 },
    ],
  });

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products';

  const handleCategoryChange = (cat: string) => {
    const varieties = getSubcategoriesForCategory(cat);
    setForm((prev) => ({
      ...prev,
      category: cat,
      title: varieties.length > 0 ? varieties[0] : '',
    }));
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories', { cache: 'no-store' });
        if (!response.ok) return;

        const data = await response.json();
        const cats: string[] = Array.isArray(data.categories) ? data.categories : [];
        setCategories(cats);
        if (cats.length > 0) {
          const defaultCat = cats.find((c: string) => c === 'Guppies') || cats[0];
          const varieties = getSubcategoriesForCategory(defaultCat);
          setForm(prev => ({
            ...prev,
            category: defaultCat,
            title: varieties.length > 0 ? varieties[0] : ''
          }));
        }
      } catch {
        setCategories([]);
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

  const removeImage = () => {
    setImageUrl('');
    setUploadError('');
  };

  const handleAddShippingRange = (fieldName: string) => {
    setForm(prev => ({
      ...prev,
      [fieldName]: [
        ...(prev as any)[fieldName],
        { id: uuidv4(), weightRange: '', estimatedQuantity: '', charge: '' }
      ]
    }));
  };

  const handleRemoveShippingRange = (fieldName: string, id: string) => {
    setForm(prev => ({
      ...prev,
      [fieldName]: (prev as any)[fieldName].filter((r: any) => r.id !== id)
    }));
  };

  const handleShippingRangeChange = (fieldName: string, id: string, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [fieldName]: (prev as any)[fieldName].map((r: any) => {
        if (r.id === id) {
          if (field === 'charge') return { ...r, charge: value === '' ? '' : Number(value) };
          return { ...r, [field]: value };
        }
        return r;
      })
    }));
  };

  const validateStep = (step: number) => {
    setSubmitError('');
    if (step === 1) {
      if (!form.category || !form.title) {
        setSubmitError('Category and Variety Title are required.');
        return false;
      }
    } else if (step === 2) {
      if (!imageUrl) {
        setUploadError('Please upload a product image before proceeding.');
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
      // Validate that all shipping charges entered are numbers
      let valid = true;
      const regions = ['North', 'South'];
      const categoriesKeys = ['1', '2', '3', '4'];
      for (const r of regions) {
        for (const c of categoriesKeys) {
          const fieldName = `shipping${r}${c}Ranges`;
          const ranges = (form as any)[fieldName] || [];
          for (const range of ranges) {
            if (range.charge !== '' && (isNaN(Number(range.charge)) || Number(range.charge) < 0)) {
              setSubmitError(`Invalid shipping charge in ${r} India Tier ${c}.`);
              valid = false;
              break;
            }
          }
          if (!valid) break;
        }
        if (!valid) break;
      }
      return valid;
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
        perPiecePrice: form.pricingType === 'piece' ? Number(form.price) : undefined,
        perPairPrice: form.pricingType === 'pair' ? Number(form.price) : undefined,
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : undefined,
        ageCategory: form.ageCategory,
        shippingNorth1Ranges: form.shippingNorth1Ranges,
        shippingNorth2Ranges: form.shippingNorth2Ranges,
        shippingNorth3Ranges: form.shippingNorth3Ranges,
        shippingNorth4Ranges: form.shippingNorth4Ranges,
        shippingSouth1Ranges: form.shippingSouth1Ranges,
        shippingSouth2Ranges: form.shippingSouth2Ranges,
        shippingSouth3Ranges: form.shippingSouth3Ranges,
        shippingSouth4Ranges: form.shippingSouth4Ranges,
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

  const renderShippingTable = (catKey: '1' | '2' | '3' | '4', label: string, subtitle: string) => {
    const fieldName = `shipping${shippingRegion}${catKey}Ranges`;
    const ranges = (form as any)[fieldName] || [];

    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              {label}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => handleAddShippingRange(fieldName)}
            className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-blue-600 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
          >
            <Plus className="h-3 w-3" /> Add Range
          </button>
        </div>

        <div className="hidden md:grid grid-cols-[1.3fr_1.3fr_1fr_36px] gap-3 mb-1 px-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weight Range</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Quantity</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shipping Charge</div>
          <div></div>
        </div>

        <div className="space-y-2.5">
          {ranges.map((range: any) => (
            <div key={range.id} className="grid grid-cols-1 md:grid-cols-[1.3fr_1.3fr_1fr_36px] gap-2 md:gap-3 items-center">
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-0.5 block md:hidden uppercase tracking-wider">Weight Range</label>
                <input
                  type="text"
                  value={range.weightRange}
                  onChange={(e) => handleShippingRangeChange(fieldName, range.id, 'weightRange', e.target.value)}
                  placeholder="e.g. Up to 0.5 KG"
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-0.5 block md:hidden uppercase tracking-wider">Est. Quantity</label>
                <input
                  type="text"
                  value={range.estimatedQuantity}
                  onChange={(e) => handleShippingRangeChange(fieldName, range.id, 'estimatedQuantity', e.target.value)}
                  placeholder="e.g. ~ 1 - 2 Pieces"
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="relative">
                <label className="text-[9px] font-bold text-slate-400 mb-0.5 block md:hidden uppercase tracking-wider">Shipping Charge</label>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">₹</span>
                <input
                  type="number"
                  value={range.charge}
                  onChange={(e) => handleShippingRangeChange(fieldName, range.id, 'charge', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-9 rounded-lg border border-slate-200 pl-6 pr-3 text-xs font-medium outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex justify-end md:justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveShippingRange(fieldName, range.id)}
                  disabled={ranges.length === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <select
                  className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Variety Title</label>
                <select
                  className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                >
                  <option value="" disabled>Select variety</option>
                  {getSubcategoriesForCategory(form.category).map((variety) => (
                    <option key={variety} value={variety}>
                      {variety}
                    </option>
                  ))}
                </select>
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
                  <option value="first-season-breeding-pair">First season breeding pair</option>
                </select>
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
            </div>
          </div>
        )}

        {/* STEP 2: MEDIA */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Upload Product Image</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload a clear high-resolution image of the aquatic specimen.</p>
            </div>

            <div className="pt-2 flex flex-col items-center justify-center">
              <CldUploadWidget
                uploadPreset={uploadPreset}
                options={{
                  sources: ['local', 'camera', 'url'],
                  multiple: false,
                  resourceType: 'image',
                }}
                onOpen={() => setUploadError('')}
                onClose={() => setIsUploading(false)}
                onSuccess={(result: any) => {
                  const info = result?.info;
                  if (info && typeof info === 'object' && 'secure_url' in info) {
                    setImageUrl(String(info.secure_url));
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
                    className={`w-full max-w-md h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors ${
                      imageUrl ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <Upload className={`h-8 w-8 ${imageUrl ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="text-sm font-bold text-slate-700">
                      {isUploading ? 'Uploading Image...' : imageUrl ? 'Change Product Image' : 'Click to Upload Image'}
                    </span>
                    <span className="text-xs text-slate-400">Supported formats: JPG, PNG, WEBP</span>
                  </button>
                )}
              </CldUploadWidget>

              {uploadError && (
                <p className="text-xs text-rose-500 font-bold mt-2">{uploadError}</p>
              )}

              {imageUrl && (
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-slate-200 shadow-md mt-6">
                  <img src={imageUrl} alt="Uploaded variety preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md border border-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Price (Optional, ₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                  <input
                    type="number"
                    className="w-full h-11 pl-8 pr-4 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    placeholder="0"
                    min={0}
                    value={form.originalPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discount Percentage (%)</label>
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
                  <input
                    type="number"
                    className="w-full h-11 pl-4 pr-8 rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    placeholder="0"
                    min={0}
                    max={100}
                    value={form.discountPercentage}
                    onChange={(e) => setForm((prev) => ({ ...prev, discountPercentage: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SHIPPING CONFIG */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">4. Shipping Setup</h2>
                <p className="text-xs text-slate-500 mt-0.5">Define weight-based shipping charges across regional zones.</p>
              </div>
              
              {/* Region Selector */}
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 shadow-2xs border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setShippingRegion('North')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    shippingRegion === 'North'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏔️ North India
                </button>
                <button
                  type="button"
                  onClick={() => setShippingRegion('South')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    shippingRegion === 'South'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌴 South India
                </button>
              </div>
            </div>

            <div className={`rounded-2xl border-2 p-4 sm:p-5 space-y-4 transition-all duration-300 ${
              shippingRegion === 'North' 
                ? 'border-blue-100 bg-blue-50/10' 
                : 'border-orange-100 bg-orange-50/10'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{shippingRegion === 'North' ? '🏔️' : '🌴'}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {shippingRegion === 'North' ? 'North India shipping settings' : 'South India shipping settings'}
                  </h3>
                  <p className="text-slate-500 text-[11px] font-medium">
                    Configure weight ranges and charges for deliveries to {shippingRegion === 'North' ? 'North India' : 'South India'} states.
                  </p>
                </div>
              </div>

              {renderShippingTable('1', 'A. 1-2 Pieces', 'Shipping charges when buyer orders 1-2 pieces.')}
              {renderShippingTable('2', 'B. 3-5 Pieces', 'Shipping charges when buyer orders 3-5 pieces.')}
              {renderShippingTable('3', 'C. 6-10 Pieces', 'Shipping charges when buyer orders 6-10 pieces.')}
              {renderShippingTable('4', 'D. 10+ Pieces', 'Shipping charges when buyer orders 10 or more pieces.')}
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
                  <p className="text-slate-900 font-semibold mt-0.5">{form.ageCategory}</p>
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
