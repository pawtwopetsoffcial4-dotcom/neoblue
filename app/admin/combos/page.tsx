"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, X, Search, Package, Star, Edit3, Check,
  ChevronRight, ImagePlus, Loader2, ArrowLeft, Minus,
  AlertTriangle, Tag, TrendingUp, Eye, Sparkles,
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

type SelectedProduct = {
  product: Product;
  quantity: number;
  customImage?: string;
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
  selectedProducts: SelectedProduct[];
};

type StepErrors = Partial<Record<keyof ComboFormState | 'products', string>>;

// ── Constants ──────────────────────────────────────────────────────────────

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

const STEPS = [
  { num: 1 as const, label: 'Details',         desc: 'Name, price & settings'  },
  { num: 2 as const, label: 'Products',         desc: 'Choose what\'s inside'   },
  { num: 3 as const, label: 'Media & Publish',  desc: 'Images & live preview'   },
];

// ── Helper ─────────────────────────────────────────────────────────────────

function savingsPct(price: number, original?: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

// ══════════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminCombosPage() {

  // ── Global ──────────────────────────────────────────────────────────────
  const [view,    setView]    = useState<'list' | 'wizard'>('list');
  const [combos,  setCombos]  = useState<Combo[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast,     setToast]     = useState<{ text: string; ok: boolean } | null>(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);

  // ── Listing ─────────────────────────────────────────────────────────────
  const [listSearch,    setListSearch]    = useState('');
  const [filterStatus,  setFilterStatus]  = useState<'all' | 'active' | 'inactive' | 'featured'>('all');

  // ── Wizard ──────────────────────────────────────────────────────────────
  const [step,          setStep]          = useState<1 | 2 | 3>(1);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [form,          setForm]          = useState<ComboFormState>(EMPTY_FORM);
  const [stepErrors,    setStepErrors]    = useState<StepErrors>({});
  const [prodSearch,    setProdSearch]    = useState('');
  const [prodCategory,  setProdCategory]  = useState('All');

  // ── Data ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        apiClient.getCombos({ adminAll: 'true' }) as Promise<{ combos: Combo[] }>,
        apiClient.getProducts({ limit: 500 })     as Promise<{ products: Product[] }>,
      ]);
      setCombos(cRes.combos ?? []);
      setAllProducts(
        (pRes.products ?? []).filter(p => p.approvalStatus === 'approved' && p.inStock !== false)
      );
    } catch {
      notify('Failed to load data', false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function notify(text: string, ok = true) {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4500);
  }

  // ── Wizard open / close ─────────────────────────────────────────────────

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStep(1);
    setProdSearch('');
    setProdCategory('All');
    setStepErrors({});
    setView('wizard');
  }

  function openEdit(combo: Combo) {
    setEditingId(combo._id);
    setForm({
      name:         combo.name,
      description:  combo.description,
      price:        String(combo.price),
      originalPrice: combo.originalPrice != null ? String(combo.originalPrice) : '',
      coverImage:   combo.coverImage,
      images:       combo.images ?? [],
      isActive:     combo.isActive,
      isFeatured:   combo.isFeatured,
      tag:          combo.tag ?? '',
      shippingCharge: String(combo.shippingCharge ?? 0),
      selectedProducts: combo.products.map((cp: any) => ({
        product:     cp.productId,
        quantity:    cp.quantity,
        customImage: cp.customImage || '',
      })),
    });
    setStep(1);
    setProdSearch('');
    setProdCategory('All');
    setStepErrors({});
    setView('wizard');
  }

  function closeWizard() {
    setView('list');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStep(1);
    setStepErrors({});
  }

  const upd = (key: keyof ComboFormState, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const clearErr = (key: keyof StepErrors) =>
    setStepErrors(prev => { const n = { ...prev }; delete n[key]; return n; });

  // ── Validation ──────────────────────────────────────────────────────────

  function validateStep1() {
    const e: StepErrors = {};
    if (!form.name.trim())                    e.name        = 'Combo name is required';
    if (!form.description.trim())             e.description = 'Description is required';
    if (!form.price || Number(form.price) <= 0) e.price     = 'Price must be greater than 0';
    setStepErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: StepErrors = {};
    if (form.selectedProducts.length < 2)
      e.products = 'Please add at least 2 products to the combo';
    setStepErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e: StepErrors = {};
    if (!form.coverImage) e.coverImage = 'A cover image is required before publishing';
    setStepErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  }

  // ── Product browser helpers ─────────────────────────────────────────────

  const productCategories = useMemo(() => {
    const cats = Array.from(new Set(allProducts.map(p => p.category))).sort();
    return ['All', ...cats];
  }, [allProducts]);

  const browserProducts = useMemo(() => {
    const q = prodSearch.toLowerCase();
    const sel = new Set(form.selectedProducts.map(sp => sp.product._id));
    return allProducts.filter(p => {
      const catOk  = prodCategory === 'All' || p.category === prodCategory;
      const qOk    = !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const notSel = !sel.has(p._id);
      return catOk && qOk && notSel;
    });
  }, [allProducts, prodSearch, prodCategory, form.selectedProducts]);

  function addProduct(p: Product) {
    setForm(prev => ({ ...prev, selectedProducts: [...prev.selectedProducts, { product: p, quantity: 1 }] }));
  }

  function removeProduct(id: string) {
    setForm(prev => ({ ...prev, selectedProducts: prev.selectedProducts.filter(sp => sp.product._id !== id) }));
  }

  function bumpQty(id: string, delta: number) {
    setForm(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(sp =>
        sp.product._id === id ? { ...sp, quantity: Math.max(1, sp.quantity + delta) } : sp
      ),
    }));
  }

  function setCustomImage(id: string, url: string) {
    setForm(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(sp =>
        sp.product._id === id ? { ...sp, customImage: url } : sp
      ),
    }));
  }

  // ── AI generate name + description ──────────────────────────────────────

  async function generateWithAI() {
    if (form.selectedProducts.length < 2) {
      notify('Add at least 2 products first so AI knows what to write about', false);
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/combos/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken') ?? ''}`,
        },
        body: JSON.stringify({
          products: form.selectedProducts.map(sp => ({
            title:     sp.product.title,
            category:  sp.product.category,
            waterType: sp.product.waterType,
          })),
          price: form.price ? Number(form.price) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');
      upd('name',        data.name);
      upd('description', data.description);
      clearErr('name');
      clearErr('description');
      notify('AI suggestions applied ✓');
    } catch (err: any) {
      notify(err.message || 'AI generation failed', false);
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!validateStep3()) return;
    const payload = {
      name:          form.name.trim(),
      description:   form.description.trim(),
      products:      form.selectedProducts.map(sp => ({
        productId:   sp.product._id,
        quantity:    sp.quantity,
        customImage: sp.customImage || '',
      })),
      price:         Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      coverImage:    form.coverImage,
      images:        form.images,
      isActive:      form.isActive,
      isFeatured:    form.isFeatured,
      tag:           form.tag,
      shippingCharge: Number(form.shippingCharge) || 0,
    };
    setIsSaving(true);
    try {
      if (editingId) {
        await apiClient.updateCombo(editingId, payload);
        notify('Combo updated ✓');
      } else {
        await apiClient.createCombo(payload);
        notify('Combo published ✓');
      }
      closeWizard();
      loadData();
    } catch (err: any) {
      notify(err.message || 'Failed to save combo', false);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Quick toggles ───────────────────────────────────────────────────────

  async function quickToggle(id: string, field: 'isActive' | 'isFeatured', cur: boolean) {
    setCombos(prev => prev.map(c => c._id === id ? { ...c, [field]: !cur } : c));
    try {
      await apiClient.updateCombo(id, { [field]: !cur });
    } catch {
      setCombos(prev => prev.map(c => c._id === id ? { ...c, [field]: cur } : c));
      notify('Failed to update', false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    try {
      await apiClient.deleteCombo(id);
      setCombos(prev => prev.filter(c => c._id !== id));
      setDeleteId(null);
      notify('Combo deleted');
    } catch {
      notify('Failed to delete', false);
    }
  }

  // ── Filtered listing ────────────────────────────────────────────────────

  const filteredCombos = useMemo(() => {
    const q = listSearch.toLowerCase();
    return combos.filter(c => {
      const matchQ = !q || c.name.toLowerCase().includes(q);
      const matchF =
        filterStatus === 'all'      ? true :
        filterStatus === 'active'   ? c.isActive :
        filterStatus === 'inactive' ? !c.isActive :
        /* featured */                c.isFeatured;
      return matchQ && matchF;
    });
  }, [combos, listSearch, filterStatus]);

  const stats = useMemo(() => ({
    total:    combos.length,
    active:   combos.filter(c => c.isActive).length,
    inactive: combos.filter(c => !c.isActive).length,
    featured: combos.filter(c => c.isFeatured).length,
  }), [combos]);

  // ── Wizard derived values ───────────────────────────────────────────────

  const wizardSavings = (form.price && form.originalPrice)
    ? savingsPct(Number(form.price), Number(form.originalPrice))
    : 0;

  const runningTotal = form.selectedProducts.reduce(
    (acc, sp) => acc + sp.product.price * sp.quantity, 0
  );

  // ── Shared Toast ────────────────────────────────────────────────────────

  const Toast = toast ? (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-sm ${
      toast.ok
        ? 'bg-emerald-900/95 text-emerald-50 border-emerald-700'
        : 'bg-rose-900/95   text-rose-50   border-rose-700'
    }`}>
      {toast.ok
        ? <Check         className="h-4 w-4 shrink-0" />
        : <AlertTriangle className="h-4 w-4 shrink-0" />}
      {toast.text}
    </div>
  ) : null;

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════

  if (view === 'list') return (
    <div className="py-8 space-y-6">
      {Toast}

      {/* Delete confirm -------------------------------------------------- */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-black text-slate-900">Delete this combo?</p>
                <p className="text-sm text-slate-500 mt-1">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
              >Cancel</button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header ---------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" /> Combos & Packs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage curated product bundles</p>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" /> New Combo
        </button>
      </div>

      {/* Stats ----------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'Total',    val: stats.total,    col: 'text-slate-800',  bg: 'bg-white border-slate-200' },
          { label: 'Active',   val: stats.active,   col: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Inactive', val: stats.inactive, col: 'text-slate-500',  bg: 'bg-slate-50 border-slate-200' },
          { label: 'Featured', val: stats.featured, col: 'text-amber-700',  bg: 'bg-amber-50 border-amber-100' },
        ] as const).map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.col}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter ------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={listSearch}
            onChange={e => setListSearch(e.target.value)}
            placeholder="Search combos…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'inactive', 'featured'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filterStatus === f
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Grid ------------------------------------------------------------ */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
          <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="font-bold text-slate-700 text-base">
            {combos.length === 0 ? 'No combos yet' : 'No matches found'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {combos.length === 0
              ? 'Click "New Combo" to create your first bundle.'
              : 'Try adjusting your search or filter.'}
          </p>
          {combos.length === 0 && (
            <button
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
            >
              <Plus className="h-4 w-4" /> Create First Combo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCombos.map(combo => {
            const savings = savingsPct(combo.price, combo.originalPrice);
            return (
              <div key={combo._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex">
                  {/* Cover */}
                  <div className="relative w-36 shrink-0 bg-slate-100">
                    {combo.coverImage ? (
                      <img src={combo.coverImage} alt={combo.name} className="h-full w-full object-cover absolute inset-0" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center min-h-[10rem]">
                        <Package className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                    {/* Status dot */}
                    <div className={`absolute top-2 left-2 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm z-10 ${combo.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    {combo.isFeatured && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center shadow z-10">
                        <Star className="h-3 w-3 text-white fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-4 min-w-0">
                    {/* Title + actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate text-sm">{combo.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {combo.tag && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{combo.tag}</span>
                          )}
                          {savings > 0 && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{savings}% off</span>
                          )}
                          <span className="text-[10px] font-semibold text-slate-400">{combo.products.length} items</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => openEdit(combo)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        ><Edit3 className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={() => setDeleteId(combo._id)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          title="Delete"
                        ><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mt-2.5">
                      <span className="text-lg font-black text-slate-900">₹{combo.price.toLocaleString('en-IN')}</span>
                      {combo.originalPrice && (
                        <span className="text-xs text-slate-400 line-through">₹{combo.originalPrice.toLocaleString('en-IN')}</span>
                      )}
                    </div>

                    {/* Product thumbnails */}
                    {combo.products.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {combo.products.slice(0, 6).map((cp, i) => (
                          <div key={i} className="h-5 w-5 rounded-md overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                            {cp.productId?.images?.[0] && (
                              <img src={cp.productId.images[0]} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                        ))}
                        {combo.products.length > 6 && (
                          <span className="text-[10px] text-slate-400 font-semibold ml-0.5">+{combo.products.length - 6}</span>
                        )}
                      </div>
                    )}

                    {/* Toggle row */}
                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-50">
                      <button
                        onClick={() => quickToggle(combo._id, 'isActive', combo.isActive)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                          combo.isActive
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >{combo.isActive ? '● Active' : '○ Inactive'}</button>
                      <button
                        onClick={() => quickToggle(combo._id, 'isFeatured', combo.isFeatured)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                          combo.isFeatured
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >{combo.isFeatured ? '★ Featured' : '☆ Feature'}</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // WIZARD VIEW — 3-step full-page builder
  // ══════════════════════════════════════════════════════════════════════════

  return (
    // Stretch out of the admin layout padding
    <div className="-mx-3 sm:-mx-6 lg:-mx-8 -my-5 sm:-my-6 lg:-my-8 flex min-h-screen bg-slate-50">
      {Toast}

      {/* ── Wizard Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-slate-100 py-8 px-5 sticky top-16 h-[calc(100vh-4rem)]">

        {/* Back */}
        <button
          onClick={closeWizard}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8 font-semibold w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back to combos
        </button>

        {/* Wizard title */}
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
            {editingId ? 'Editing Combo' : 'New Combo'}
          </p>
          <h2 className="text-lg font-black text-slate-900 leading-snug">
            {editingId ? 'Update your bundle' : 'Build your bundle'}
          </h2>
          {form.name && <p className="text-xs text-slate-400 mt-1 truncate">{form.name}</p>}
        </div>

        {/* Step list */}
        <div className="space-y-1.5">
          {STEPS.map(s => {
            const isActive = step === s.num;
            const isDone   = step > s.num;
            return (
              <div key={s.num} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-blue-50' : ''}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black transition-all ${
                  isDone   ? 'bg-emerald-500 text-white' :
                  isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' :
                             'bg-slate-100 text-slate-400'
                }`}>
                  {isDone ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <div>
                  <p className={`text-sm font-bold leading-none ${isActive ? 'text-blue-700' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</p>
                  <p className={`text-[11px] mt-0.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="mt-auto">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 text-center">Step {step} of 3</p>
        </div>
      </aside>

      {/* ── Wizard Main ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Mobile back bar */}
        <div className="md:hidden sticky top-16 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <button onClick={closeWizard} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-1.5">
            {STEPS.map(s => (
              <div key={s.num} className={`h-2 rounded-full transition-all ${step === s.num ? 'w-6 bg-blue-600' : step > s.num ? 'w-2 bg-emerald-400' : 'w-2 bg-slate-200'}`} />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-400">Step {step}/3</span>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-10">

          {/* ════════════════ STEP 1 — DETAILS ════════════════ */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Combo Details</h2>
                <p className="text-sm text-slate-500 mt-1">Give your combo a name, description and pricing.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">

                {/* AI Generate row */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    {form.selectedProducts.length >= 2
                      ? `AI will write based on your ${form.selectedProducts.length} selected products`
                      : 'Select at least 2 products (Step 2) first to use AI'}
                  </p>
                  <button
                    type="button"
                    onClick={generateWithAI}
                    disabled={isGenerating || form.selectedProducts.length < 2}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95"
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" /> Generate with AI</>
                    )}
                  </button>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Combo Name *</label>
                  <input
                    value={form.name}
                    onChange={e => { upd('name', e.target.value); clearErr('name'); }}
                    placeholder="e.g. Guppy Starter Pack"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${stepErrors.name ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                  />
                  {stepErrors.name && <p className="text-xs text-red-500 mt-1.5">{stepErrors.name}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => { upd('description', e.target.value); clearErr('description'); }}
                    rows={3}
                    placeholder="Describe what makes this combo special…"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${stepErrors.description ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                  />
                  {stepErrors.description && <p className="text-xs text-red-500 mt-1.5">{stepErrors.description}</p>}
                </div>


                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Combo Price (₹) *</label>
                    <input
                      type="number" min={0}
                      value={form.price}
                      onChange={e => { upd('price', e.target.value); clearErr('price'); }}
                      placeholder="999"
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${stepErrors.price ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                    />
                    {stepErrors.price && <p className="text-xs text-red-500 mt-1.5">{stepErrors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Original Price (₹)</label>
                    <input
                      type="number" min={0}
                      value={form.originalPrice}
                      onChange={e => upd('originalPrice', e.target.value)}
                      placeholder="1499 (shows savings)"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Savings indicator */}
                {wizardSavings > 0 && (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700 font-semibold">
                      Customers save <strong>{wizardSavings}%</strong> — ₹{(Number(form.originalPrice) - Number(form.price)).toLocaleString('en-IN')} off retail
                    </p>
                  </div>
                )}

                {/* Shipping + Tag */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Shipping Charge (₹)</label>
                    <input
                      type="number" min={0}
                      value={form.shippingCharge}
                      onChange={e => upd('shippingCharge', e.target.value)}
                      placeholder="0 = free shipping"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Tag / Badge</label>
                    <select
                      value={form.tag}
                      onChange={e => upd('tag', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {TAG_OPTIONS.map(t => <option key={t} value={t}>{t || '— None —'}</option>)}
                    </select>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-8 pt-2 border-t border-slate-100">
                  {([
                    { key: 'isActive'   as const, label: 'Active',   sub: 'Visible to customers', color: 'bg-emerald-500' },
                    { key: 'isFeatured' as const, label: 'Featured', sub: 'Show on homepage',     color: 'bg-amber-400'  },
                  ]).map(({ key, label, sub, color }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
                      <button
                        type="button"
                        onClick={() => upd(key, !form[key])}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${form[key] ? color : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form[key] ? 'translate-x-5' : ''}`} />
                      </button>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{label}</p>
                        <p className="text-[11px] text-slate-400">{sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  Next: Choose Products <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ════════════════ STEP 2 — PRODUCTS ════════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Choose Products</h2>
                <p className="text-sm text-slate-500 mt-1">Browse your catalog and add at least 2 products.</p>
              </div>

              {stepErrors.products && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {stepErrors.products}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Left: Product browser ── */}
                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
                  {/* Browser controls */}
                  <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Catalog</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={prodSearch}
                        onChange={e => setProdSearch(e.target.value)}
                        placeholder="Search by name or category…"
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {/* Category chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {productCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setProdCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            prodCategory === cat
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >{cat}</button>
                      ))}
                    </div>
                  </div>

                  {/* Product rows */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-72 lg:max-h-96">
                    {browserProducts.length === 0 ? (
                      <div className="py-10 text-center text-sm text-slate-400">
                        {allProducts.length === 0 ? 'No approved products available' : 'No products match your search'}
                      </div>
                    ) : browserProducts.map(p => (
                      <button
                        key={p._id}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{p.title}</p>
                          <p className="text-xs text-slate-400">₹{p.price.toLocaleString('en-IN')} · {p.category}</p>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-blue-100 group-hover:bg-blue-600 flex items-center justify-center transition-colors shrink-0">
                          <Plus className="h-3.5 w-3.5 text-blue-600 group-hover:text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Right: Selected products ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Selected ({form.selectedProducts.length})
                      {form.selectedProducts.length < 2 && (
                        <span className="ml-2 text-red-400 normal-case font-semibold text-[11px]">
                          — add {2 - form.selectedProducts.length} more
                        </span>
                      )}
                    </p>
                    {runningTotal > 0 && (
                      <p className="text-xs text-slate-500">
                        Retail: <strong className="text-slate-800">₹{runningTotal.toLocaleString('en-IN')}</strong>
                      </p>
                    )}
                  </div>

                  {form.selectedProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center text-slate-400">
                      <Package className="h-9 w-9 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm font-semibold">Add products from the catalog</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 lg:max-h-96 overflow-y-auto pr-1">
                      {form.selectedProducts.map(({ product, quantity, customImage }) => (
                        <div key={product._id} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2.5">
                          <div className="flex items-center gap-3">
                            {/* Thumbnail */}
                            <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                              {(customImage || product.images?.[0]) && (
                                <img src={customImage || product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{product.title}</p>
                              <p className="text-xs text-slate-400">₹{product.price.toLocaleString('en-IN')} each</p>
                            </div>
                            {/* Qty stepper */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => bumpQty(product._id, -1)}
                                className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                              ><Minus className="h-3 w-3" /></button>
                              <span className="w-7 text-center text-sm font-black text-slate-900">{quantity}</span>
                              <button
                                onClick={() => bumpQty(product._id, 1)}
                                className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                              ><Plus className="h-3 w-3" /></button>
                            </div>
                            {/* Remove */}
                            <button
                              onClick={() => removeProduct(product._id)}
                              className="h-7 w-7 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                            ><X className="h-3.5 w-3.5" /></button>
                          </div>

                          {/* Custom image row */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Photo:</span>
                            {product.images?.slice(0, 5).map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setCustomImage(product._id, img)}
                                className={`h-6 w-6 rounded-lg overflow-hidden border transition-all ${
                                  (customImage || product.images?.[0]) === img
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-slate-200 opacity-50 hover:opacity-100'
                                }`}
                              ><img src={img} alt="" className="h-full w-full object-cover" /></button>
                            ))}
                            <ImageKitUploadWidget
                              folder="/combos"
                              options={{ multiple: false, resourceType: 'image' }}
                              onSuccess={(r: any) => { const u = r?.info?.secure_url; if (u) setCustomImage(product._id, u); }}
                            >
                              {({ open }) => (
                                <button
                                  type="button"
                                  onClick={() => open()}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded-lg transition-colors"
                                ><ImagePlus className="h-3 w-3" /> Upload</button>
                              )}
                            </ImageKitUploadWidget>
                            {customImage && (
                              <button
                                type="button"
                                onClick={() => setCustomImage(product._id, '')}
                                className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold"
                              >Reset</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Running total card */}
                  {form.selectedProducts.length >= 2 && form.price && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium">Retail total</span>
                        <span className="font-black text-slate-700">₹{runningTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium">Combo price</span>
                        <span className="font-black text-blue-700">₹{Number(form.price).toLocaleString('en-IN')}</span>
                      </div>
                      {runningTotal > Number(form.price) && (
                        <div className="pt-1.5 border-t border-blue-100 flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                          <Check className="h-3.5 w-3.5" />
                          Customers save ₹{(runningTotal - Number(form.price)).toLocaleString('en-IN')} vs buying separately
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
                ><ArrowLeft className="h-4 w-4" /> Back</button>
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >Next: Media & Publish <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {/* ════════════════ STEP 3 — MEDIA & PUBLISH ════════════════ */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Media & Publish</h2>
                <p className="text-sm text-slate-500 mt-1">Add images and review your combo before publishing.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Left: Images ── */}
                <div className="space-y-5">
                  {/* Cover image */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cover Image *</p>
                    {stepErrors.coverImage && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {stepErrors.coverImage}
                      </p>
                    )}
                    {form.coverImage ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 group">
                        <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          onClick={() => upd('coverImage', '')}
                          className="absolute top-2 right-2 h-8 w-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                        ><X className="h-4 w-4 text-white" /></button>
                      </div>
                    ) : (
                      <ImageKitUploadWidget
                        folder="/combos"
                        options={{ multiple: false, resourceType: 'image' }}
                        onSuccess={(r: any) => {
                          const u = r?.info?.secure_url;
                          if (u) { upd('coverImage', u); clearErr('coverImage'); }
                        }}
                      >
                        {({ open, isUploading }) => (
                          <button
                            onClick={() => open()}
                            disabled={isUploading}
                            className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group ${
                              stepErrors.coverImage
                                ? 'border-red-300 bg-red-50/50 hover:border-red-400'
                                : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                            }`}
                          >
                            {isUploading ? (
                              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                            ) : (
                              <>
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${stepErrors.coverImage ? 'bg-red-100' : 'bg-slate-100 group-hover:bg-blue-100'}`}>
                                  <ImagePlus className={`h-6 w-6 ${stepErrors.coverImage ? 'text-red-500' : 'text-slate-400 group-hover:text-blue-500'}`} />
                                </div>
                                <div className="text-center">
                                  <p className={`text-sm font-semibold ${stepErrors.coverImage ? 'text-red-500' : 'text-slate-600 group-hover:text-blue-600'}`}>Click to upload cover image</p>
                                  <p className="text-xs text-slate-400 mt-0.5">PNG, JPG up to 15 MB</p>
                                </div>
                              </>
                            )}
                          </button>
                        )}
                      </ImageKitUploadWidget>
                    )}
                  </div>

                  {/* Additional images */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Additional Images</p>
                    <div className="flex flex-wrap gap-2">
                      {form.images.map((img, i) => (
                        <div key={i} className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-100 group shrink-0">
                          <img src={img} alt="" className="h-full w-full object-cover" />
                          <button
                            onClick={() => upd('images', form.images.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"
                          ><X className="h-4 w-4 text-white" /></button>
                        </div>
                      ))}
                      <ImageKitUploadWidget
                        folder="/combos"
                        options={{ multiple: true, resourceType: 'image' }}
                        onSuccess={(r: any) => {
                          const u = r?.info?.secure_url;
                          if (u) upd('images', [...form.images, u]);
                        }}
                      >
                        {({ open, isUploading }) => (
                          <button
                            onClick={() => open()}
                            disabled={isUploading}
                            className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center transition-all shrink-0"
                          >
                            {isUploading
                              ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                              : <Plus className="h-5 w-5 text-slate-400" />}
                          </button>
                        )}
                      </ImageKitUploadWidget>
                    </div>
                  </div>
                </div>

                {/* ── Right: Preview + Summary ── */}
                <div className="space-y-4">
                  {/* Storefront preview */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Storefront Preview</p>
                    </div>

                    {/* Card replica matching CombosClient */}
                    <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm max-w-[260px] mx-auto">
                      {/* Cover area */}
                      <div className="relative aspect-[4/3] bg-slate-100">
                        {form.coverImage
                          ? <img src={form.coverImage} alt="preview" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10 text-slate-200" /></div>
                        }
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {form.isFeatured && (
                            <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                              <Star className="h-2 w-2 fill-current" /> Featured
                            </span>
                          )}
                          {form.tag && (
                            <span className="flex items-center gap-1 bg-white/90 text-slate-700 text-[9px] font-semibold px-2 py-0.5 rounded-full shadow">
                              <Tag className="h-2 w-2" /> {form.tag}
                            </span>
                          )}
                          {wizardSavings > 0 && (
                            <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">{wizardSavings}% off</span>
                          )}
                        </div>
                      </div>
                      {/* Product thumbnail strip */}
                      {form.selectedProducts.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 pt-2.5">
                          {form.selectedProducts.slice(0, 4).map((sp, i) => (
                            <div key={i} className="h-6 w-6 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                              {(sp.customImage || sp.product.images?.[0]) && (
                                <img src={sp.customImage || sp.product.images[0]} alt="" className="h-full w-full object-cover" />
                              )}
                            </div>
                          ))}
                          {form.selectedProducts.length > 4 && (
                            <span className="text-[9px] text-slate-400 font-semibold">+{form.selectedProducts.length - 4}</span>
                          )}
                        </div>
                      )}
                      {/* Card info */}
                      <div className="p-3">
                        <p className="font-black text-slate-900 text-sm truncate">
                          {form.name || <span className="text-slate-300 font-normal">Combo name…</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {form.description || <span className="text-slate-200">Description…</span>}
                        </p>
                        <div className="flex items-center justify-between mt-2.5">
                          <div>
                            <span className="text-sm font-black text-slate-900">
                              {form.price ? `₹${Number(form.price).toLocaleString('en-IN')}` : '₹—'}
                            </span>
                            {form.originalPrice && (
                              <span className="text-[11px] text-slate-400 line-through ml-1.5">₹{Number(form.originalPrice).toLocaleString('en-IN')}</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{form.selectedProducts.length} items</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Combo Summary</p>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Products',   val: `${form.selectedProducts.length} items` },
                        { label: 'Price',      val: form.price ? `₹${Number(form.price).toLocaleString('en-IN')}` : '—' },
                        { label: 'Shipping',   val: form.shippingCharge && Number(form.shippingCharge) > 0 ? `₹${form.shippingCharge}` : 'Free' },
                        { label: 'Tag',        val: form.tag || 'None' },
                        { label: 'Status',     val: form.isActive   ? 'Active'    : 'Inactive',  color: form.isActive   ? 'text-emerald-600' : 'text-slate-400' },
                        { label: 'Featured',   val: form.isFeatured ? 'Yes'       : 'No',        color: form.isFeatured ? 'text-amber-600'   : 'text-slate-400' },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">{r.label}</span>
                          <span className={`font-bold text-slate-800 ${(r as any).color || ''}`}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
                ><ArrowLeft className="h-4 w-4" /> Back</button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm px-7 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  {isSaving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : <><Sparkles className="h-4 w-4" /> {editingId ? 'Update Combo' : 'Publish Combo'}</>
                  }
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
