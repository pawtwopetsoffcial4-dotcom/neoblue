"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Plus, Loader2, Trash2, BookOpen, FolderTree, Tags, MessageSquare, Star, Sparkles, Search, Users, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';

type AdminOrder = { _id: string; totalAmount: number; status: string };
type AdminUser = { _id: string; role: 'user' | 'vendor' | 'admin' };
type AdminConfig = { categories?: string[]; subcategories?: Record<string, string[]> };
type DashboardProduct = {
  _id: string;
  title: string;
  category: string;
  images: string[];
  isTrending?: boolean;
  isNewArrival?: boolean;
  approvalStatus?: string;
};

const normalizeCategory = (value: string) => value.trim().replace(/\s+/g, ' ');

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [subcategories, setSubcategories] = useState<Record<string, string[]>>({});
  const [selectedCategoryForVarieties, setSelectedCategoryForVarieties] = useState<string>('');
  const [varietyInput, setVarietyInput] = useState('');
  const [varietiesSaving, setVarietiesSaving] = useState(false);
  const [varietiesMessage, setVarietiesMessage] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [featuredMessage, setFeaturedMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const response = (await apiClient.getAdminOverview()) as {
          orders: AdminOrder[];
          users: AdminUser[];
        };

        setOrders(response.orders ?? []);
        setUsers(response.users ?? []);
      } catch {
        setOrders([]);
        setUsers([]);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        const data = (await apiClient.request<AdminConfig>('/config')) as AdminConfig;
        const loadedCats = Array.isArray(data.categories) ? data.categories : [];
        setCategories(loadedCats);
        setSubcategories(data.subcategories && typeof data.subcategories === 'object' ? data.subcategories : {});
        if (loadedCats.length > 0) {
          setSelectedCategoryForVarieties(loadedCats[0]);
        }
      } catch (err) {
        setCategories([]);
        setSubcategories({});
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        const data = (await apiClient.getProducts()) as { products: DashboardProduct[] };
        setProducts(data.products ?? []);
      } catch (err) {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleToggleTrending = async (product: DashboardProduct) => {
    try {
      setFeaturedMessage(null);
      const nextValue = !product.isTrending;
      await apiClient.updateProduct(product._id, { isTrending: nextValue });
      setProducts((current) =>
        current.map((p) => (p._id === product._id ? { ...p, isTrending: nextValue } : p))
      );
      setFeaturedMessage(`Trending status updated for "${product.title}"`);
    } catch (error: any) {
      setFeaturedMessage(error?.message || 'Failed to update trending status');
    }
  };

  const handleToggleNewArrival = async (product: DashboardProduct) => {
    try {
      setFeaturedMessage(null);
      const nextValue = !product.isNewArrival;
      await apiClient.updateProduct(product._id, { isNewArrival: nextValue });
      setProducts((current) =>
        current.map((p) => (p._id === product._id ? { ...p, isNewArrival: nextValue } : p))
      );
      setFeaturedMessage(`New arrival status updated for "${product.title}"`);
    } catch (error: any) {
      setFeaturedMessage(error?.message || 'Failed to update new arrival status');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = searchCategory === 'All' || p.category === searchCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, searchCategory]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const vendorCount = users.filter((user) => user.role === 'vendor').length;

  const uniqueCategories = useMemo(() => Array.from(new Set(categories.map(normalizeCategory))).filter(Boolean), [categories]);

  const addCategory = () => {
    const nextCategory = normalizeCategory(categoryInput);
    if (!nextCategory) return;

    setCategories((current) => Array.from(new Set([...current, nextCategory])));
    setCategoryInput('');
    setConfigMessage(null);
  };

  const removeCategory = (category: string) => {
    setCategories((current) => current.filter((item) => item !== category));
    setConfigMessage(null);
  };

  const saveCategories = async () => {
    try {
      setConfigSaving(true);
      setConfigMessage(null);

      const data = (await apiClient.request<AdminConfig>('/config', {
        method: 'PUT',
        body: JSON.stringify({ categories: uniqueCategories }),
      })) as AdminConfig;

      setCategories(Array.isArray(data.categories) ? data.categories : uniqueCategories);
      setConfigMessage('Categories saved.');
    } catch (error: any) {
      setConfigMessage(error?.message || 'Unable to save categories.');
    } finally {
      setConfigSaving(false);
    }
  };

  const addVariety = () => {
    const nextVariety = normalizeCategory(varietyInput);
    if (!nextVariety || !selectedCategoryForVarieties) return;

    setSubcategories((current) => {
      const currentList = Array.isArray(current[selectedCategoryForVarieties]) ? current[selectedCategoryForVarieties] : [];
      return {
        ...current,
        [selectedCategoryForVarieties]: Array.from(new Set([...currentList, nextVariety])),
      };
    });
    setVarietyInput('');
    setVarietiesMessage(null);
  };

  const removeVariety = (variety: string) => {
    if (!selectedCategoryForVarieties) return;
    setSubcategories((current) => {
      const currentList = Array.isArray(current[selectedCategoryForVarieties]) ? current[selectedCategoryForVarieties] : [];
      return {
        ...current,
        [selectedCategoryForVarieties]: currentList.filter((v) => v !== variety),
      };
    });
    setVarietiesMessage(null);
  };

  const saveVarieties = async () => {
    try {
      setVarietiesSaving(true);
      setVarietiesMessage(null);

      const data = (await apiClient.request<AdminConfig>('/config', {
        method: 'PUT',
        body: JSON.stringify({ subcategories }),
      })) as AdminConfig;

      setSubcategories(data.subcategories && typeof data.subcategories === 'object' ? data.subcategories : subcategories);
      setVarietiesMessage('Varieties saved.');
    } catch (error: any) {
      setVarietiesMessage(error?.message || 'Unable to save varieties.');
    } finally {
      setVarietiesSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Title Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100/90 mb-1.5">Management Portal</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">Admin Dashboard</h1>
          <p className="text-sm text-blue-100/80 mt-2.5 max-w-xl">
            Welcome to the control center. Configure categories, moderate blog publications, and curate featured aquatic products for the homepage.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="group rounded-3xl bg-gradient-to-br from-white to-blue-50/20 border border-blue-100/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-3xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Users</p>
              <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">{users.length}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="group rounded-3xl bg-gradient-to-br from-white to-purple-50/20 border border-blue-100/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-600 rounded-l-3xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Vendors</p>
              <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">{vendorCount}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="group rounded-3xl bg-gradient-to-br from-white to-emerald-50/20 border border-blue-100/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600 rounded-l-3xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Orders</p>
              <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">{orders.length}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="group rounded-3xl bg-gradient-to-br from-white to-rose-50/20 border border-blue-100/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-600 rounded-l-3xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Revenue</p>
              <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main sections layout: Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Blog Management Card */}
        <section className="lg:col-span-12 rounded-3xl bg-white border border-blue-100/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Publications</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Blog Management</h2>
              <p className="text-sm text-slate-500 mt-0.5">Quick access to blog posts, tags, comments and layout configurations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/blogs" className="group rounded-2xl border border-blue-100/50 p-5 bg-gradient-to-b from-blue-50/20 to-indigo-50/10 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-4 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="font-bold text-slate-900 group-hover:text-white transition-colors">Blogs</p>
              <p className="text-xs text-slate-600 mt-1.5 group-hover:text-blue-100/85 transition-colors">Create and edit articles</p>
            </Link>

            <Link href="/admin/blogs/categories" className="group rounded-2xl border border-blue-100/50 p-5 bg-gradient-to-b from-blue-50/20 to-indigo-50/10 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-4 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <FolderTree className="h-5 w-5" />
              </div>
              <p className="font-bold text-slate-900 group-hover:text-white transition-colors">Categories</p>
              <p className="text-xs text-slate-600 mt-1.5 group-hover:text-blue-100/85 transition-colors">Organize blog sections</p>
            </Link>

            <Link href="/admin/blogs/tags" className="group rounded-2xl border border-blue-100/50 p-5 bg-gradient-to-b from-blue-50/20 to-indigo-50/10 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-4 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <Tags className="h-5 w-5" />
              </div>
              <p className="font-bold text-slate-900 group-hover:text-white transition-colors">Tags</p>
              <p className="text-xs text-slate-600 mt-1.5 group-hover:text-blue-100/85 transition-colors">Manage tag library</p>
            </Link>

            <Link href="/admin/blogs/comments" className="group rounded-2xl border border-blue-100/50 p-5 bg-gradient-to-b from-blue-50/20 to-indigo-50/10 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-4 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="font-bold text-slate-900 group-hover:text-white transition-colors">Comments</p>
              <p className="text-xs text-slate-600 mt-1.5 group-hover:text-blue-100/85 transition-colors">Moderate readers</p>
            </Link>
          </div>
        </section>

        {/* Left Column: Categories and Varieties stacked */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category Management Card */}
          <section className="rounded-3xl bg-white border border-blue-100/80 p-6 shadow-sm space-y-5 flex flex-col">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Catalog</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Categories</h2>
              <p className="text-sm text-slate-500 mt-0.5">Control product categories available in the store.</p>
            </div>

            <div className="flex flex-col gap-3">
              <input
                value={categoryInput}
                onChange={(event) => setCategoryInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCategory();
                  }
                }}
                placeholder="Enter category name..."
                className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow focus:shadow-md bg-white text-slate-900"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addCategory}
                  className="h-10 flex-1 rounded-xl bg-blue-600 text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
                <button
                  type="button"
                  onClick={saveCategories}
                  disabled={configSaving}
                  className="h-10 px-5 rounded-xl border border-blue-200 text-blue-700 font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors disabled:opacity-60 bg-white"
                >
                  {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>

            {configMessage ? (
              <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">{configMessage}</p>
            ) : null}

            <div className="flex-1 overflow-y-auto max-h-64 pr-1">
              {configLoading ? (
                <div className="text-sm text-slate-500 py-4">Loading categories...</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {uniqueCategories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-3.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100/60 transition-colors"
                    >
                      {category}
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="text-blue-400 hover:text-rose-600 transition-colors"
                        aria-label={`Remove ${category}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  {uniqueCategories.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4">No custom categories yet.</p>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          {/* Varieties Management Card */}
          <section className="rounded-3xl bg-white border border-blue-100/80 p-6 shadow-sm space-y-5 flex flex-col">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Catalog</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Varieties</h2>
              <p className="text-sm text-slate-500 mt-0.5">Control species variety names for each category.</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase tracking-widest text-slate-400">Select Category</label>
                <select
                  value={selectedCategoryForVarieties}
                  onChange={(e) => {
                    setSelectedCategoryForVarieties(e.target.value);
                    setVarietiesMessage(null);
                  }}
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-900"
                >
                  <option value="" disabled>Choose a category...</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-bold text-slate-450 uppercase tracking-widest text-slate-400">Add Variety Name</label>
                <input
                  value={varietyInput}
                  onChange={(e) => setVarietyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addVariety();
                    }
                  }}
                  placeholder="Enter variety/species name..."
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-900"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addVariety}
                  className="h-10 flex-1 rounded-xl bg-blue-600 text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
                <button
                  type="button"
                  onClick={saveVarieties}
                  disabled={varietiesSaving}
                  className="h-10 px-5 rounded-xl border border-blue-200 text-blue-700 font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors disabled:opacity-60 bg-white"
                >
                  {varietiesSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>

            {varietiesMessage ? (
              <p className={`text-xs font-medium px-3 py-2 rounded-xl border ${
                varietiesMessage.includes('saved') 
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                  : 'text-rose-600 bg-rose-50 border-rose-100'
              }`}>{varietiesMessage}</p>
            ) : null}

            <div className="flex-1 overflow-y-auto max-h-64 pr-1">
              <div className="flex flex-wrap gap-2">
                {selectedCategoryForVarieties && Array.isArray(subcategories[selectedCategoryForVarieties]) &&
                  subcategories[selectedCategoryForVarieties].map((variety) => (
                    <span
                      key={variety}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-3.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100/60 transition-colors"
                    >
                      {variety}
                      <button
                        type="button"
                        onClick={() => removeVariety(variety)}
                        className="text-blue-400 hover:text-rose-600 transition-colors"
                        aria-label={`Remove ${variety}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                {(!selectedCategoryForVarieties || !Array.isArray(subcategories[selectedCategoryForVarieties]) || subcategories[selectedCategoryForVarieties].length === 0) ? (
                  <p className="text-sm text-slate-400 py-4">No varieties defined yet for this category.</p>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        {/* Featured Fishes Curation Card */}
        <section className="lg:col-span-7 rounded-3xl bg-white border border-blue-100/80 p-6 shadow-sm space-y-5 flex flex-col h-full">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Curation</p>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Featured Fishes</h2>
            <p className="text-sm text-slate-500 mt-0.5">Showcase products as Trending or New Arrivals on the homepage.</p>
          </div>

          {/* Filters and search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search fishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-9 pr-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow focus:shadow-md bg-white text-slate-900"
              />
            </div>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-950"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {featuredMessage && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 animate-fadeIn">
              {featuredMessage}
            </div>
          )}

          <div className="flex-1 overflow-y-auto max-h-80 pr-1 border border-blue-50 rounded-2xl bg-slate-50/30">
            {productsLoading ? (
              <div className="text-sm text-slate-500 py-6 text-center">Loading fishes list...</div>
            ) : (
              <div className="divide-y divide-blue-50">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 hover:bg-white transition-colors bg-white/45 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/50 shadow-sm">
                        <img
                          src={product.images?.[0] || 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate leading-snug">{product.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium">{product.category}</span>
                          {product.approvalStatus && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider ${
                              product.approvalStatus === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {product.approvalStatus}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleTrending(product)}
                        className={`h-8 w-8 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                          product.isTrending
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                            : 'bg-white border-blue-100 text-blue-400 hover:text-blue-600 hover:bg-blue-50/50'
                        }`}
                        title="Toggle Trending"
                      >
                        <Star className={`h-4 w-4 ${product.isTrending ? 'fill-white' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleToggleNewArrival(product)}
                        className={`h-8 w-8 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                          product.isNewArrival
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-105'
                            : 'bg-white border-emerald-100 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50'
                        }`}
                        title="Toggle New Arrival"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-center text-slate-400 py-8 text-xs">No fishes found.</div>
                )}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
