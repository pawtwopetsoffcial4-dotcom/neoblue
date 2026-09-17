"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, X, Search, Package, Star, ToggleLeft, ToggleRight,
  Edit3, Save, ChevronDown, ChevronUp, ImagePlus, Loader2, Check
} from 'lucide-react';
import ImageKitUploadWidget from '@/app/components/ImageKitUploadWidget';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────────

type Product = {
  _id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  waterType: string;
  vendorId?: { _id: string; name: string } | string;
  approvalStatus?: string;
  inStock?: boolean;
};

type ComboProduct = {
  productId: Product;
  quantity: number;
  customImage?: string;
};

type Combo = {
  _id: string;
  name: string;
  description: string;
  products: ComboProduct[];
  price: number;
  originalPrice?: number;
  coverImage: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  tag: string;
  shippingCharge: number;
  createdAt: string;
  updatedAt: string;
};

type ComboFormState = {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  coverImage: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  tag: string;
  shippingCharge: string;
  selectedProducts: Array<{ product: Product; quantity: number; customImage?: string }>;
};

const EMPTY_FORM: ComboFormState = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  coverImage: '',
  images: [],
  isActive: true,
  isFeatured: false,
  tag: '',
  shippingCharge: '0',
  selectedProducts: [],
};

const TAG_OPTIONS = ['', 'Best Seller', 'New', 'Limited Edition', 'Trending', 'Value Pack', 'Staff Pick'];

// ── Helper ──────────────────────────────────────────────────────────────────

function savingsPercent(price: number, original: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

// ── Component ───────────────────────────────────────────────────────────────

export default function AdminCombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [form, setForm] = useState<ComboFormState>(EMPTY_FORM);

  // Product picker
  const [productSearch, setProductSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Expanded combo card
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [combosRes, productsRes] = await Promise.all([
        apiClient.getCombos({ adminAll: 'true' }) as Promise<{ combos: Combo[] }>,
        apiClient.getProducts({ limit: 500 }) as Promise<{ products: Product[] }>,
      ]);
      setCombos(combosRes.combos ?? []);
      setAllProducts(
        (productsRes.products ?? []).filter(
          (p) => p.approvalStatus === 'approved' && p.inStock !== false
        )
      );
    } catch {
      setMessage({ text: 'Failed to load data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // ── Form helpers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingComboId(null);
    setForm(EMPTY_FORM);
    setProductSearch('');
    setModalOpen(true);
  };

  const openEdit = (combo: Combo) => {
    setEditingComboId(combo._id);
    setForm({
      name: combo.name,
      description: combo.description,
      price: String(combo.price),
      originalPrice: combo.originalPrice != null ? String(combo.originalPrice) : '',
      coverImage: combo.coverImage,
      images: combo.images ?? [],
      isActive: combo.isActive,
      isFeatured: combo.isFeatured,
      tag: combo.tag ?? '',
      shippingCharge: String(combo.shippingCharge ?? 0),
      selectedProducts: combo.products.map((cp: any) => ({
        product: cp.productId,
        quantity: cp.quantity,
        customImage: cp.customImage || '',
      })),
    });
    setProductSearch('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingComboId(null);
    setForm(EMPTY_FORM);
    setPickerOpen(false);
    setProductSearch('');
  };

  const updateForm = (key: keyof ComboFormState, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Product picker ────────────────────────────────────────────────────────

  const filteredPickerProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        (p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
        !form.selectedProducts.find((sp) => sp.product._id === p._id)
    );
  }, [allProducts, productSearch, form.selectedProducts]);

  const addProduct = (product: Product) => {
    setForm((prev) => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, { product, quantity: 1 }],
    }));
    setProductSearch('');
  };

  const removeProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((sp) => sp.product._id !== productId),
    }));
  };

  const updateProductQty = (productId: string, qty: number) => {
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map((sp) =>
        sp.product._id === productId ? { ...sp, quantity: Math.max(1, qty) } : sp
      ),
    }));
  };

  const updateProductCustomImage = (productId: string, customImage: string) => {
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map((sp) =>
        sp.product._id === productId ? { ...sp, customImage } : sp
      ),
    }));
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) return showMsg('Name is required', 'error');
    if (!form.description.trim()) return showMsg('Description is required', 'error');
    if (!form.price || Number(form.price) <= 0) return showMsg('Price must be greater than 0', 'error');
    if (!form.coverImage) return showMsg('Cover image is required', 'error');
    if (form.selectedProducts.length < 2) return showMsg('Please add at least 2 products', 'error');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      products: form.selectedProducts.map((sp) => ({
        productId: sp.product._id,
        quantity: sp.quantity,
        customImage: sp.customImage || '',
      })),
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      coverImage: form.coverImage,
      images: form.images,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      tag: form.tag,
      shippingCharge: Number(form.shippingCharge) || 0,
    };

    setIsSaving(true);
    try {
      if (editingComboId) {
        await apiClient.updateCombo(editingComboId, payload);
        showMsg('Combo updated successfully');
      } else {
        await apiClient.createCombo(payload);
        showMsg('Combo created successfully');
      }
      closeModal();
      loadData();
    } catch (err: any) {
      showMsg(err.message || 'Failed to save combo', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Quick toggles ─────────────────────────────────────────────────────────

  const quickToggle = async (id: string, field: 'isActive' | 'isFeatured', current: boolean) => {
    try {
      await apiClient.updateCombo(id, { [field]: !current });
      setCombos((prev) =>
        prev.map((c) => (c._id === id ? { ...c, [field]: !current } : c))
      );
    } catch {
      showMsg('Failed to update combo', 'error');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete combo "${name}"? This cannot be undone.`)) return;
    try {
      await apiClient.deleteCombo(id);
      setCombos((prev) => prev.filter((c) => c._id !== id));
      showMsg('Combo deleted');
    } catch {
      showMsg('Failed to delete combo', 'error');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" /> Combo Packages
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage curated product bundles</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" /> New Combo
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : combos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No combos yet</h3>
          <p className="text-sm text-slate-400 mt-1">Click "New Combo" to create your first bundle</p>
        </div>
      ) : (
        <div className="space-y-4">
          {combos.map((combo) => {
            const isExpanded = expandedId === combo._id;
            const savings = savingsPercent(combo.price, combo.originalPrice ?? 0);
            return (
              <div
                key={combo._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex items-center gap-4 p-4">
                  {/* Cover */}
                  <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    {combo.coverImage ? (
                      <img src={combo.coverImage} alt={combo.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-slate-300 m-auto mt-4" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900 truncate">{combo.name}</h2>
                      {combo.tag && (
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {combo.tag}
                        </span>
                      )}
                      {savings > 0 && (
                        <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          {savings}% off
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="font-bold text-slate-800">₹{combo.price}</span>
                      {combo.originalPrice && (
                        <span className="line-through text-slate-400">₹{combo.originalPrice}</span>
                      )}
                      <span>·</span>
                      <span>{combo.products.length} products</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Active toggle */}
                    <button
                      onClick={() => quickToggle(combo._id, 'isActive', combo.isActive)}
                      title={combo.isActive ? 'Active – click to deactivate' : 'Inactive – click to activate'}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        combo.isActive
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {combo.isActive ? 'Active' : 'Inactive'}
                    </button>

                    {/* Featured toggle */}
                    <button
                      onClick={() => quickToggle(combo._id, 'isFeatured', combo.isFeatured)}
                      title={combo.isFeatured ? 'Featured' : 'Not featured'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        combo.isFeatured
                          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                          : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(combo)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(combo._id, combo.name)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Expand */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : combo._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded products */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-50 pt-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Included Products
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {combo.products.map((cp, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-slate-50 rounded-xl p-3"
                        >
                          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-white border border-slate-100">
                            {cp.productId?.images?.[0] ? (
                              <img
                                src={cp.productId.images[0]}
                                alt={cp.productId.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-slate-300 m-auto mt-2.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {cp.productId?.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              ₹{cp.productId?.price} · Qty: {cp.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{combo.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Modal ═══════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {editingComboId ? 'Edit Combo' : 'Create New Combo'}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Modal Message */}
              {message && (
                <div
                  className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {message.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
                  {message.text}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Combo Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="e.g. Guppy Starter Pack"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={3}
                  placeholder="Describe what makes this combo special..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Price row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Combo Price (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    placeholder="999"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.originalPrice}
                    onChange={(e) => updateForm('originalPrice', e.target.value)}
                    placeholder="1499 (for savings badge)"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Shipping + Tag row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Shipping Charge (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.shippingCharge}
                    onChange={(e) => updateForm('shippingCharge', e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Tag / Badge
                  </label>
                  <select
                    value={form.tag}
                    onChange={(e) => updateForm('tag', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {TAG_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t || '— None —'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button
                    onClick={() => updateForm('isActive', !form.isActive)}
                    className={`w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white ml-1 transition-transform ${form.isActive ? 'translate-x-4' : ''}`} />
                  </button>
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button
                    onClick={() => updateForm('isFeatured', !form.isFeatured)}
                    className={`w-10 h-6 rounded-full transition-colors ${form.isFeatured ? 'bg-amber-400' : 'bg-slate-300'}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white ml-1 transition-transform ${form.isFeatured ? 'translate-x-4' : ''}`} />
                  </button>
                  <span className="text-sm font-medium text-slate-700">Featured on Home</span>
                </label>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Cover Image *
                </label>
                {form.coverImage ? (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={form.coverImage} alt="Cover" className="h-full w-full object-cover" />
                    <button
                      onClick={() => updateForm('coverImage', '')}
                      className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <ImageKitUploadWidget
                    folder="/combos"
                    options={{ multiple: false, resourceType: 'image' }}
                    onSuccess={(result: any) => {
                      const url = result?.info?.secure_url;
                      if (url) updateForm('coverImage', url);
                    }}
                  >
                    {({ open }) => (
                      <button
                        onClick={() => open()}
                        className="flex items-center gap-2 text-sm text-blue-600 font-semibold border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-xl px-4 py-3 transition-colors"
                      >
                        <ImagePlus className="h-4 w-4" /> Upload Cover Image
                      </button>
                    )}
                  </ImageKitUploadWidget>
                )}
              </div>

              {/* Product Picker ────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Products * <span className="text-slate-400 font-normal normal-case">(min 2)</span>
                </label>

                {/* Selected products */}
                {form.selectedProducts.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {form.selectedProducts.map(({ product, quantity, customImage }) => (
                      <div
                        key={product._id}
                        className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-white border border-slate-200">
                            {customImage || product.images?.[0] ? (
                              <img src={customImage || product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-slate-300 m-auto mt-2.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{product.title}</p>
                            <p className="text-xs text-slate-500">₹{product.price}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-xs text-slate-500">Qty:</label>
                            <input
                              type="number"
                              min={1}
                              value={quantity}
                              onChange={(e) => updateProductQty(product._id, Number(e.target.value))}
                              className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <button
                              onClick={() => removeProduct(product._id)}
                              className="p-1 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Custom Image Picker Bar for this product in combo */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Combo Photo:</span>

                          {/* Gallery Photos Picker */}
                          {product.images && product.images.length > 1 && (
                            <div className="flex items-center gap-1.5">
                              {product.images.map((imgUrl, imgIdx) => (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() => updateProductCustomImage(product._id, imgUrl)}
                                  className={`h-7 w-7 rounded-lg overflow-hidden border transition-all ${
                                    (customImage || product.images[0]) === imgUrl ? 'border-blue-600 ring-2 ring-blue-200 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                                  }`}
                                  title={`Use Gallery Photo ${imgIdx + 1}`}
                                >
                                  <img src={imgUrl} alt={`Photo ${imgIdx + 1}`} className="h-full w-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Upload Custom Image */}
                          <ImageKitUploadWidget
                            folder="/combos"
                            options={{ multiple: false, resourceType: 'image' }}
                            onSuccess={(result: any) => {
                              const url = result?.info?.secure_url;
                              if (url) updateProductCustomImage(product._id, url);
                            }}
                          >
                            {({ open }) => (
                              <button
                                type="button"
                                onClick={() => open()}
                                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold text-[11px] hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <ImagePlus className="h-3 w-3 text-blue-600" /> Custom Upload
                              </button>
                            )}
                          </ImageKitUploadWidget>

                          {/* Reset to Default */}
                          {customImage && (
                            <button
                              type="button"
                              onClick={() => updateProductCustomImage(product._id, '')}
                              className="px-2 py-1 text-slate-400 hover:text-slate-700 text-[11px] font-semibold cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      value={productSearch}
                      onChange={(e) => { setProductSearch(e.target.value); setPickerOpen(true); }}
                      onFocus={() => setPickerOpen(true)}
                      placeholder="Search products to add..."
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Dropdown */}
                  {pickerOpen && productSearch && filteredPickerProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xl z-50">
                    {filteredPickerProducts.slice(0, 20).map((p) => (
                      <button
                        key={p._id}
                        onClick={() => { addProduct(p); setPickerOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                          {p.images?.[0] && (
                            <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                          <p className="text-xs text-slate-400">₹{p.price} · {p.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>
            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="h-4 w-4" /> {editingComboId ? 'Update Combo' : 'Create Combo'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
