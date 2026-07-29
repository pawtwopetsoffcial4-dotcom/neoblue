"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, PackageSearch, PlusCircle, X, Trash2, Plus } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { apiClient } from '@/lib/api-client';
import { FISH_NAMES, PRODUCT_CATEGORIES, getSubcategoriesForCategory } from '@/lib/catalog';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useAuth } from '@/lib/hooks/useAuth';

type EditProductForm = {
  title: string;
  description: string;
  pricingType: 'piece' | 'pair';
  unitPrice: string;
  weightPerPiece: string;
  category: string;
  waterType: 'Freshwater' | 'Saltwater' | 'Brackish';
  tag: string;
  scientific: string;
  originalPrice: string;
  discountPercentage: string;
  stockQuantity: string;
  soldQuantity: string;
  size: string;
  ageCategory: string;
  inStock: boolean;
  deliverNorth: boolean;
  deliverSouth: boolean;
  phMin: string;
  phMax: string;
  tempMin: string;
  tempMax: string;
  temperament: 'Peaceful' | 'Semi-aggressive' | 'Aggressive';
  images: string[];
  videos: string[];
  quickOverview: string;
  aboutSpecies: string;
  behavioralTraits: string;
  genderIdentification: string;
  sustainabilitySourcing: string;
  section5Title: string;
  section5Content: string;
  careTemp: string;
  carePh: string;
  careWaterHardness: string;
  careWaterCurrent: string;
  careTankSetup: string;
  careHidingSpots: string;
  lightingRequirement: 'Low' | 'Medium' | 'High';
  co2Requirement: 'None' | 'Recommended' | 'High';
  growthRate: 'Slow' | 'Moderate' | 'Fast';
  placement: 'Foreground' | 'Midground' | 'Background' | 'Floating' | 'Epiphyte';
  careDifficulty: 'Easy' | 'Moderate' | 'Advanced';
};

export default function VendorProductsPage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [editingProduct, setEditingProduct] = useState<MarketplaceProduct | null>(null);
  const [editForm, setEditForm] = useState<EditProductForm | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editFaq, setEditFaq] = useState<Array<{ q: string; a: string }>>([]);
  const [editNewQuestion, setEditNewQuestion] = useState('');
  const [editNewAnswer, setEditNewAnswer] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [dropdownCategories, setDropdownCategories] = useState<string[]>(PRODUCT_CATEGORIES as unknown as string[]);
  const [dbSubcategories, setDbSubcategories] = useState<Record<string, string[]>>({});
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [customVarietyMode, setCustomVarietyMode] = useState(false);
  const { user } = useAuth();

  const getVarietiesForCategory = (cat: string) => {
    const configSubs = dbSubcategories[cat] || [];
    const staticSubs = getSubcategoriesForCategory(cat);
    return Array.from(new Set([...configSubs, ...staticSubs]));
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

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
  }, [products]);

  const loadProducts = async () => {
    if (!user?.id) return;
    try {
      const response = (await apiClient.getProducts({ vendorId: user.id })) as { products: MarketplaceProduct[] };
      setProducts(response.products ?? []);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user?.id]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiClient.request<{ categories?: string[]; subcategories?: Record<string, string[]> }>('/config');
        const configCats = Array.isArray(data.categories) ? data.categories : [];
        const staticCats = PRODUCT_CATEGORIES as unknown as string[];
        const merged = Array.from(new Set([...configCats, ...staticCats]));
        setDropdownCategories(merged);
        setDbSubcategories(data.subcategories && typeof data.subcategories === 'object' ? data.subcategories : {});
      } catch {
        // Keep fallback static categories
      }
    };
    loadCategories();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteProduct(id);
      loadProducts();
    } catch {
      // keep MVP simple
    }
  };

  const openEdit = (product: MarketplaceProduct) => {
    setEditingProduct(product);
    setEditError('');
    setEditFaq(Array.isArray(product.faq) ? product.faq : []);
    setEditNewQuestion('');
    setEditNewAnswer('');
    setEditForm({
      title: product.title ?? '',
      description: product.description ?? '',
      pricingType: typeof product.perPairPrice === 'number' ? 'pair' : 'piece',
      unitPrice:
        typeof product.perPairPrice === 'number'
          ? String(product.perPairPrice)
          : (product.perPiecePrice != null ? String(product.perPiecePrice) : ''),
      weightPerPiece: product.weightPerPiece != null ? String(product.weightPerPiece) : '250',
      category: product.category ?? 'Guppies',
      waterType: product.waterType ?? 'Freshwater',
      tag: product.tag ?? 'Standard',
      scientific: product.scientific ?? '',
      originalPrice: product.originalPrice != null ? String(product.originalPrice) : '',
      discountPercentage: product.discountPercentage != null ? String(product.discountPercentage) : '',
      stockQuantity: product.stockQuantity != null ? String(product.stockQuantity) : '0',
      soldQuantity: product.soldQuantity != null ? String(product.soldQuantity) : '0',
      size: product.size ?? '',
      ageCategory: product.ageCategory ?? 'adult',
      inStock: product.inStock,
      deliverNorth: product.deliverNorth !== false,
      deliverSouth: product.deliverSouth !== false,
      phMin: product.phMin != null ? String(product.phMin) : '6.0',
      phMax: product.phMax != null ? String(product.phMax) : '8.0',
      tempMin: product.tempMin != null ? String(product.tempMin) : '20',
      tempMax: product.tempMax != null ? String(product.tempMax) : '30',
      temperament: product.temperament ?? 'Peaceful',
      images: Array.isArray(product.images) ? product.images : [],
      videos: Array.isArray(product.videos) ? product.videos : [],
      quickOverview: product.quickOverview ?? '',
      aboutSpecies: product.aboutSpecies ?? '',
      behavioralTraits: product.behavioralTraits ?? '',
      genderIdentification: product.genderIdentification ?? '',
      sustainabilitySourcing: product.sustainabilitySourcing ?? '',
      section5Title: product.section5Title ?? '',
      section5Content: product.section5Content ?? '',
      careTemp: product.careTemp ?? '',
      carePh: product.carePh ?? '',
      careWaterHardness: product.careWaterHardness ?? '',
      careWaterCurrent: product.careWaterCurrent ?? '',
      careTankSetup: product.careTankSetup || '',
      careHidingSpots: product.careHidingSpots || '',
      lightingRequirement: (product as any).lightingRequirement ?? 'Medium',
      co2Requirement: (product as any).co2Requirement ?? 'Recommended',
      growthRate: (product as any).growthRate ?? 'Moderate',
      placement: (product as any).placement ?? 'Midground',
      careDifficulty: (product as any).careDifficulty ?? 'Moderate',
    });
  };

  const closeEdit = () => {
    setEditingProduct(null);
    setEditForm(null);
    setEditError('');
    setEditFaq([]);
    setEditNewQuestion('');
    setEditNewAnswer('');
    setIsSavingEdit(false);
    setIsGeneratingDesc(false);
  };

  const handleGenerateEditDescription = async () => {
    if (!editForm || !editForm.title) return;
    setIsGeneratingDesc(true);
    setEditError('');
    try {
      const res = await apiClient.request('/vendor/generate-description', {
        method: 'POST',
        body: JSON.stringify({
          title: editForm.title,
          category: editForm.category,
          waterType: editForm.waterType,
        }),
      }) as any;
      if (res.description) {
        setEditForm(prev => prev ? { ...prev, description: res.description } : prev);
      }
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || 'Failed to generate description');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const saveEdit = async () => {
    if (!editingProduct || !editForm) return;

    const originalPrice = editForm.originalPrice ? Number(editForm.originalPrice) : undefined;
    const discountPercentage = editForm.discountPercentage ? Number(editForm.discountPercentage) : undefined;
    const unitPrice = Number(editForm.unitPrice);
    const weightPerPiece = Number(editForm.weightPerPiece);
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      setEditError('Unit price must be a valid positive number');
      return;
    }
    if (Number.isNaN(weightPerPiece) || weightPerPiece <= 0) {
      setEditError('Weight per piece must be a valid positive number');
      return;
    }

    try {
      setIsSavingEdit(true);
      setEditError('');
      await registerCustomCategoryAndVariety(editForm.category, editForm.title);
      await apiClient.updateProduct(editingProduct._id, {
        title: editForm.title,
        description: editForm.description,
        images: editForm.images,
        videos: editForm.videos,
        price: unitPrice,
        category: editForm.category,
        waterType: editForm.waterType,
        tag: editForm.tag,
        scientific: editForm.scientific,
        originalPrice,
        discountPercentage,
        perPiecePrice: editForm.pricingType === 'piece' ? unitPrice : null,
        perPairPrice: editForm.pricingType === 'pair' ? unitPrice : null,
        weightPerPiece,
        stockQuantity: Number(editForm.stockQuantity) || 0,
        soldQuantity: Number(editForm.soldQuantity) || 0,
        inStock: (Number(editForm.stockQuantity) || 0) > 0,
        size: editForm.size,
        ageCategory: editForm.ageCategory,
        deliverNorth: editForm.deliverNorth,
        deliverSouth: editForm.deliverSouth,
        phMin: Number(editForm.phMin),
        phMax: Number(editForm.phMax),
        tempMin: Number(editForm.tempMin),
        tempMax: Number(editForm.tempMax),
        temperament: editForm.temperament,
        faq: editFaq,
        quickOverview: editForm.quickOverview,
        aboutSpecies: editForm.aboutSpecies,
        behavioralTraits: editForm.behavioralTraits,
        genderIdentification: editForm.genderIdentification,
        sustainabilitySourcing: editForm.sustainabilitySourcing,
        section5Title: editForm.section5Title,
        section5Content: editForm.section5Content,
        careTemp: editForm.careTemp,
        carePh: editForm.carePh,
        careWaterHardness: editForm.careWaterHardness,
        careWaterCurrent: editForm.careWaterCurrent,
        careTankSetup: editForm.careTankSetup,
        careHidingSpots: editForm.careHidingSpots,
        ...(editForm.category === 'Plants' && {
          lightingRequirement: editForm.lightingRequirement,
          co2Requirement: editForm.co2Requirement,
          growthRate: editForm.growthRate,
          placement: editForm.placement,
          careDifficulty: editForm.careDifficulty,
        }),
      });
      await loadProducts();
      closeEdit();
    } catch (error: any) {
      setEditError(error?.message || 'Failed to update product');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-4xl bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-5 text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)] sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100 mb-2">Inventory</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Your Products</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50/90">
            Review stock, check pricing, and remove products quickly from one screen.
          </p>
        </div>
        <Link href="/vendor/add-product" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-blue-700 transition-colors hover:bg-blue-50 sm:shrink-0">
          <PlusCircle className="h-4 w-4" /> Add Product
        </Link>
      </section>

      <div className="rounded-4xl border border-blue-100 bg-white shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="px-6 py-16 text-center sm:px-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <PackageSearch className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No products yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add your first listing so you can manage it from this screen.
            </p>
            <Link href="/vendor/add-product" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              Add Product
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 sm:p-5 md:hidden">
              {products.map((product) => (
                <article key={product._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900">{product.title}</h2>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{product.category}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${product.inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {product.inStock ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Price</p>
                      <p className="mt-1 font-bold text-slate-900">₹{product.price.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Stock</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {product.stockQuantity ?? 0}
                        <span className="block text-[10px] text-slate-500 font-medium normal-case mt-0.5">
                          {product.soldQuantity ?? 0} total sold • {(product as any).soldAfterLastStockUpdate ?? 0} sold since reload
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-200 px-4 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                      >
                        Edit <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="h-10 rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden md:block overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-50 text-slate-600">
                  <tr>
                    <th className="text-left px-5 py-3">Title</th>
                    <th className="text-left px-5 py-3">Category</th>
                    <th className="text-left px-5 py-3">Price</th>
                    <th className="text-left px-5 py-3">Stock</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-t border-blue-100">
                      <td className="px-5 py-4 font-semibold text-slate-900">{product.title}</td>
                      <td className="px-5 py-4 text-slate-600">{product.category}</td>
                      <td className="px-5 py-4 text-slate-900">₹{product.price.toFixed(2)}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <span className="font-semibold text-slate-900">{product.stockQuantity ?? 0}</span>
                        <span className="block text-[11px] text-slate-500">
                          {product.soldQuantity ?? 0} total sold • {(product as any).soldAfterLastStockUpdate ?? 0} sold since reload
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                          <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEdit(product)}
                              className="inline-flex h-9 items-center gap-2 rounded-full border border-blue-200 px-4 font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                          >
                              Edit <ArrowRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="h-9 px-4 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {editingProduct && editForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-0 py-0 backdrop-blur-sm md:items-center md:px-4 md:py-6">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-4xl bg-white shadow-2xl border border-blue-100 md:rounded-4xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white px-5 py-4 md:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600 mb-1">Edit Product</p>
                <h2 className="text-xl md:text-2xl font-black tracking-tight truncate pr-4">{editingProduct.title}</h2>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="h-10 w-10 shrink-0 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                aria-label="Close edit product dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <input
                  list="vendor-fish-name-autofill"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product title"
                  value={editForm.title}
                  onChange={(event) => setEditForm((current) => current ? { ...current, title: event.target.value } : current)}
                />
                <input
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Scientific name (optional)"
                  value={editForm.scientific}
                  onChange={(event) => setEditForm((current) => current ? { ...current, scientific: event.target.value } : current)}
                />
                <select
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.pricingType}
                  onChange={(event) => setEditForm((current) => current ? { ...current, pricingType: event.target.value as EditProductForm['pricingType'] } : current)}
                >
                  <option value="piece">Price per piece</option>
                  <option value="pair">Price per pair</option>
                </select>
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={editForm.pricingType === 'piece' ? 'Per piece price' : 'Per pair price'}
                  min={0}
                  value={editForm.unitPrice}
                  onChange={(event) => setEditForm((current) => current ? { ...current, unitPrice: event.target.value } : current)}
                />
                <select
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={editForm.weightPerPiece}
                  onChange={(event) => setEditForm((current) => current ? { ...current, weightPerPiece: event.target.value } : current)}
                >
                  {[50, 75, 100, 120, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000].map((w) => (
                    <option key={w} value={w}>
                      {w >= 1000 ? `${w / 1000} kg (${w} gm)` : `${w} gm`}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Original price (optional)"
                  min={0}
                  value={editForm.originalPrice}
                  onChange={(event) => setEditForm((current) => current ? { ...current, originalPrice: event.target.value } : current)}
                />
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Discount % (optional)"
                  min={0}
                  max={100}
                  value={editForm.discountPercentage}
                  onChange={(event) => setEditForm((current) => current ? { ...current, discountPercentage: event.target.value } : current)}
                />
                <div className="flex flex-col gap-1 md:col-span-1">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !customCategoryMode;
                        setCustomCategoryMode(next);
                        if (next) {
                          setEditForm(current => current ? { ...current, category: '' } : null);
                        } else {
                          setEditForm(current => current ? { ...current, category: dropdownCategories[0] || 'Guppies' } : null);
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {customCategoryMode ? "Or select category" : "Or enter custom"}
                    </button>
                  </div>
                  {customCategoryMode ? (
                    <input
                      type="text"
                      className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white text-slate-900"
                      placeholder="Enter custom category name..."
                      value={editForm.category}
                      onChange={(event) => setEditForm((current) => current ? { ...current, category: event.target.value } : current)}
                      required
                    />
                  ) : (
                    <select
                      className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                      value={editForm.category}
                      onChange={(event) => setEditForm((current) => current ? { ...current, category: event.target.value } : current)}
                    >
                      {dropdownCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  )}
                </div>
                <select
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.waterType}
                  onChange={(event) => setEditForm((current) => current ? { ...current, waterType: event.target.value as EditProductForm['waterType'] } : current)}
                >
                  <option value="Freshwater">Freshwater</option>
                  <option value="Saltwater">Saltwater</option>
                  <option value="Brackish">Brackish</option>
                </select>
                 <input
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tag"
                  value={editForm.tag}
                  onChange={(event) => setEditForm((current) => current ? { ...current, tag: event.target.value } : current)}
                />
                <input
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product Size (e.g. 2 inches, Medium)"
                  value={editForm.size}
                  onChange={(event) => setEditForm((current) => current ? { ...current, size: event.target.value } : current)}
                />
                <select
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  value={editForm.ageCategory}
                  onChange={(event) => setEditForm((current) => current ? { ...current, ageCategory: event.target.value } : current)}
                >
                  <option value="adult">Adult</option>
                  <option value="semi-adult">Semi adult</option>
                  <option value="juvenile">Juvenile</option>
                  <option value="first-season-breeding-pair">First season breeding pair</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ideal Min pH"
                  value={editForm.phMin}
                  onChange={(event) => setEditForm((current) => current ? { ...current, phMin: event.target.value } : current)}
                />
                <input
                  type="number"
                  step="0.1"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ideal Max pH"
                  value={editForm.phMax}
                  onChange={(event) => setEditForm((current) => current ? { ...current, phMax: event.target.value } : current)}
                />
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ideal Min Temp (°C)"
                  value={editForm.tempMin}
                  onChange={(event) => setEditForm((current) => current ? { ...current, tempMin: event.target.value } : current)}
                />
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ideal Max Temp (°C)"
                  value={editForm.tempMax}
                  onChange={(event) => setEditForm((current) => current ? { ...current, tempMax: event.target.value } : current)}
                />
                {editForm.category === 'Plants' ? (
                  <>
                    <select
                      className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={editForm.lightingRequirement}
                      onChange={(event) => setEditForm((current) => current ? { ...current, lightingRequirement: event.target.value as any } : current)}
                    >
                      <option value="Low">Low Lighting</option>
                      <option value="Medium">Medium Lighting</option>
                      <option value="High">High Lighting</option>
                    </select>
                    <select
                      className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={editForm.co2Requirement}
                      onChange={(event) => setEditForm((current) => current ? { ...current, co2Requirement: event.target.value as any } : current)}
                    >
                      <option value="None">No CO2</option>
                      <option value="Recommended">CO2 Recommended</option>
                      <option value="High">High CO2</option>
                    </select>
                    <select
                      className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={editForm.placement}
                      onChange={(event) => setEditForm((current) => current ? { ...current, placement: event.target.value as any } : current)}
                    >
                      <option value="Foreground">Foreground</option>
                      <option value="Midground">Midground</option>
                      <option value="Background">Background</option>
                      <option value="Floating">Floating</option>
                      <option value="Epiphyte">Epiphyte</option>
                    </select>
                  </>
                ) : (
                  <select
                    className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={editForm.temperament}
                    onChange={(event) => setEditForm((current) => current ? { ...current, temperament: event.target.value as any } : current)}
                  >
                    <option value="Peaceful">Peaceful</option>
                    <option value="Semi-aggressive">Semi-aggressive</option>
                    <option value="Aggressive">Aggressive</option>
                  </select>
                )}
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Stock Quantity"
                  min={0}
                  value={editForm.stockQuantity}
                  onChange={(event) => setEditForm((current) => current ? { ...current, stockQuantity: event.target.value } : current)}
                />
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sold Quantity"
                  min={0}
                  value={editForm.soldQuantity}
                  onChange={(event) => setEditForm((current) => current ? { ...current, soldQuantity: event.target.value } : current)}
                />
                <label className="flex items-center gap-3 h-11 px-4 rounded-xl border border-blue-200 bg-white">
                  <input
                    type="checkbox"
                    checked={editForm.inStock}
                    onChange={(event) => setEditForm((current) => current ? { ...current, inStock: event.target.checked } : current)}
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">In stock</span>
                </label>
                <label className="flex items-center gap-3 h-11 px-4 rounded-xl border border-blue-200 bg-white">
                  <input
                    type="checkbox"
                    checked={editForm.deliverNorth}
                    onChange={(event) => setEditForm((current) => current ? { ...current, deliverNorth: event.target.checked } : current)}
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Deliver to North India</span>
                </label>
                <label className="flex items-center gap-3 h-11 px-4 rounded-xl border border-blue-200 bg-white">
                  <input
                    type="checkbox"
                    checked={editForm.deliverSouth}
                    onChange={(event) => setEditForm((current) => current ? { ...current, deliverSouth: event.target.checked } : current)}
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Deliver to South India</span>
                </label>
              </div>

              {/* Product Media Edit Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700">Product Media</h3>
                
                {/* Images */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pictures (Min 1, Max 5)</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {editForm.images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-xs group bg-slate-50">
                        <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm((curr) => curr ? { ...curr, images: curr.images.filter((_, i) => i !== index) } : null);
                          }}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md border border-white opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {editForm.images.length < 5 && (
                      <CldUploadWidget
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'}
                        options={{
                          sources: ['local', 'camera', 'url'],
                          multiple: true,
                          resourceType: 'image',
                          cropping: true,
                          croppingAspectRatio: 1,
                          showSkipCropButton: true,
                        }}
                        onSuccess={(result: any) => {
                          const info = result?.info;
                          if (info && typeof info === 'object' && 'secure_url' in info) {
                            let url = String(info.secure_url);
                            if (url.includes('/upload/')) {
                              url = url.replace('/upload/', '/upload/c_crop,g_custom/');
                            }
                            setEditForm((curr) => curr ? { ...curr, images: [...curr.images, url] } : null);
                          }
                        }}
                      >
                        {({ open }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            className="aspect-square border border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="h-5 w-5 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500">Add Picture</span>
                          </button>
                        )}
                      </CldUploadWidget>
                    )}
                  </div>
                </div>

                {/* Videos */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Videos (Optional, Max 2)</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {editForm.videos.map((vid, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-xs group bg-slate-50">
                        <video src={vid} className="w-full h-full object-cover" muted playsInline loop />
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm((curr) => curr ? { ...curr, videos: curr.videos.filter((_, i) => i !== index) } : null);
                          }}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md border border-white opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {editForm.videos.length < 2 && (
                      <CldUploadWidget
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'}
                        options={{
                          sources: ['local', 'url'],
                          multiple: false,
                          resourceType: 'video',
                        }}
                        onSuccess={(result: any) => {
                          const info = result?.info;
                          if (info && typeof info === 'object' && 'secure_url' in info) {
                            let url = String(info.secure_url);
                            setEditForm((curr) => curr ? { ...curr, videos: [...curr.videos, url] } : null);
                          }
                        }}
                      >
                        {({ open }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            className="aspect-square border border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="h-5 w-5 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500">Add Video</span>
                          </button>
                        )}
                      </CldUploadWidget>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700">Description</span>
                <button
                  type="button"
                  onClick={handleGenerateEditDescription}
                  disabled={isGeneratingDesc || !editForm.title}
                  className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-lg hover:shadow-md transition-all disabled:opacity-50"
                >
                  {isGeneratingDesc ? (
                    <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="text-[10px]">✨</span>
                  )}
                  {isGeneratingDesc ? 'Generating...' : 'Auto-Generate with AI'}
                </button>
              </div>
              <textarea
                className="w-full min-h-32 px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description"
                value={editForm.description}
                onChange={(event) => setEditForm((current) => current ? { ...current, description: event.target.value } : current)}
              />

              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Species Information</h3>
                
                <textarea
                  className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Quick Overview (2-3 sentences max)"
                  value={editForm.quickOverview}
                  onChange={(event) => setEditForm((current) => current ? { ...current, quickOverview: event.target.value } : current)}
                />
                <textarea
                  className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="About this species"
                  value={editForm.aboutSpecies}
                  onChange={(event) => setEditForm((current) => current ? { ...current, aboutSpecies: event.target.value } : current)}
                />
                <textarea
                  className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Behavioral traits and temperament"
                  value={editForm.behavioralTraits}
                  onChange={(event) => setEditForm((current) => current ? { ...current, behavioralTraits: event.target.value } : current)}
                />
                <textarea
                  className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Male and female identification"
                  value={editForm.genderIdentification}
                  onChange={(event) => setEditForm((current) => current ? { ...current, genderIdentification: event.target.value } : current)}
                />
                <textarea
                  className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Sustainability and sourcing"
                  value={editForm.sustainabilitySourcing}
                  onChange={(event) => setEditForm((current) => current ? { ...current, sustainabilitySourcing: event.target.value } : current)}
                />
                
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Custom Section Title (e.g., Section 5)"
                    value={editForm.section5Title}
                    onChange={(event) => setEditForm((current) => current ? { ...current, section5Title: event.target.value } : current)}
                  />
                  <textarea
                    className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Custom Section Content"
                    value={editForm.section5Content}
                    onChange={(event) => setEditForm((current) => current ? { ...current, section5Content: event.target.value } : current)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Care Requirements</h3>
                  <span className="text-xs text-slate-500">Up to 1400+ words total</span>
                </div>
                
                <textarea
                  className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Temperature Requirements"
                  value={editForm.careTemp}
                  onChange={(event) => setEditForm((current) => current ? { ...current, careTemp: event.target.value } : current)}
                />
                <textarea
                  className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="pH Level Requirements"
                  value={editForm.carePh}
                  onChange={(event) => setEditForm((current) => current ? { ...current, carePh: event.target.value } : current)}
                />
                <textarea
                  className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Water Hardness"
                  value={editForm.careWaterHardness}
                  onChange={(event) => setEditForm((current) => current ? { ...current, careWaterHardness: event.target.value } : current)}
                />
                <textarea
                  className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Water current and aeration"
                  value={editForm.careWaterCurrent}
                  onChange={(event) => setEditForm((current) => current ? { ...current, careWaterCurrent: event.target.value } : current)}
                />
                <textarea
                  className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Tank set-up and housing"
                  value={editForm.careTankSetup}
                  onChange={(event) => setEditForm((current) => current ? { ...current, careTankSetup: event.target.value } : current)}
                />
                <textarea
                  className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Hiding spot of the fish and decor"
                  value={editForm.careHidingSpots}
                  onChange={(event) => setEditForm((current) => current ? { ...current, careHidingSpots: event.target.value } : current)}
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

                {editFaq.length > 0 && (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {editFaq.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-bold text-slate-800">Q: {item.q}</p>
                          <p className="text-slate-600 mt-0.5">A: {item.a}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditFaq(prev => prev.filter((_, i) => i !== idx))}
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
                    value={editNewQuestion}
                    onChange={(e) => setEditNewQuestion(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Answer (e.g. Yes, they do great with small, peaceful fish...)"
                    value={editNewAnswer}
                    onChange={(e) => setEditNewAnswer(e.target.value)}
                    rows={2}
                    className="p-3 rounded-lg border border-slate-200 outline-none text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editNewQuestion.trim() && editNewAnswer.trim()) {
                        setEditFaq(prev => [...prev, { q: editNewQuestion.trim(), a: editNewAnswer.trim() }]);
                        setEditNewQuestion('');
                        setEditNewAnswer('');
                      }
                    }}
                    className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5 transition-colors self-end"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Q&A Item
                  </button>
                </div>
              </div>

              {editError && <p className="text-sm font-medium text-rose-600">{editError}</p>}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="h-11 rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={isSavingEdit}
                  className="h-11 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <datalist id="vendor-fish-name-autofill">
        {FISH_NAMES.map((fishName) => (
          <option key={`top-${fishName}`} value={fishName} />
        ))}
      </datalist>
    </div>
  );
}
