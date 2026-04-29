"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { apiClient } from '@/lib/api-client';
import { getSubcategoriesForCategory } from '@/lib/catalog';

type AdminProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category:
    | 'Guppies'
    | 'Crayfish'
    | 'Kribensis'
    | 'Betta'
    | "Angel's"
    | 'Discuss'
    | 'Platy'
    | 'Exotic Molly'
    | 'Zebra'
    | string;
  subcategory?: string;
  waterType: 'Freshwater' | 'Saltwater' | 'Brackish' | string;
  tag: string;
  inStock: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  scientific?: string;
  vendorId?: { _id?: string; name?: string; email?: string };
};

type EditFormState = {
  title: string;
  description: string;
  price: string;
  category: AdminProduct['category'];
  subcategory: string;
  waterType: AdminProduct['waterType'];
  tag: string;
  scientific: string;
  inStock: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  images: string[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = (await apiClient.getProducts()) as { products: AdminProduct[] };
      setProducts(response.products ?? []);
    } catch {
      setProducts([]);
      setMessage('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories', { cache: 'no-store' });
        if (!response.ok) return;

        const data = await response.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((p) => (p.approvalStatus ?? 'pending') === filter);
  }, [products, filter]);

  const setApproval = async (productId: string, status: 'approved' | 'rejected') => {
    try {
      setMessage(null);
      await apiClient.updateProduct(productId, { approvalStatus: status });
      setProducts((current) =>
        current.map((product) =>
          product._id === productId ? { ...product, approvalStatus: status } : product
        )
      );
      setMessage(`Product ${status} successfully`);
    } catch (error: any) {
      setMessage(error.message || 'Failed to update approval status');
    }
  };

  const openEditProduct = (product: AdminProduct) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      category: product.category,
      subcategory: product.subcategory || '',
      waterType: product.waterType,
      tag: product.tag || 'Standard',
      scientific: product.scientific || '',
      inStock: product.inStock,
      approvalStatus: product.approvalStatus ?? 'pending',
      images: product.images?.length ? [...product.images] : [],
    });
  };

  const closeEditProduct = () => {
    setEditingProduct(null);
    setEditForm(null);
    setIsSavingEdit(false);
  };

  const addEditImage = (imageUrl: string) => {
    setEditForm((current) => {
      if (!current || current.images.includes(imageUrl)) return current;
      return { ...current, images: [...current.images, imageUrl] };
    });
  };

  const removeEditImage = (imageUrl: string) => {
    setEditForm((current) => {
      if (!current) return current;
      return { ...current, images: current.images.filter((image) => image !== imageUrl) };
    });
  };

  const saveEditedProduct = async () => {
    if (!editingProduct || !editForm) return;

    const price = Number(editForm.price);
    if (Number.isNaN(price)) {
      setMessage('Price must be a valid number');
      return;
    }

    if (editForm.images.length === 0) {
      setMessage('Please add at least one product image');
      return;
    }

    try {
      setMessage(null);
      setIsSavingEdit(true);
      await apiClient.updateProduct(editingProduct._id, {
        title: editForm.title,
        description: editForm.description,
        price,
        images: editForm.images,
        category: editForm.category,
        subcategory: editForm.subcategory,
        waterType: editForm.waterType,
        tag: editForm.tag,
        scientific: editForm.scientific,
        inStock: editForm.inStock,
        approvalStatus: editForm.approvalStatus,
      });
      await loadProducts();
      setMessage('Product updated successfully');
      closeEditProduct();
    } catch (error: any) {
      setMessage(error.message || 'Failed to update product');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;

    try {
      setMessage(null);
      await apiClient.deleteProduct(productId);
      setProducts((current) => current.filter((p) => p._id !== productId));
      setMessage('Product deleted successfully');
    } catch (error: any) {
      setMessage(error.message || 'Failed to delete product');
    }
  };

  const countByStatus = {
    pending: products.filter((p) => (p.approvalStatus ?? 'pending') === 'pending').length,
    approved: products.filter((p) => (p.approvalStatus ?? 'pending') === 'approved').length,
    rejected: products.filter((p) => (p.approvalStatus ?? 'pending') === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Moderation</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Products Approval</h1>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{countByStatus.pending}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Approved</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{countByStatus.approved}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Rejected</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{countByStatus.rejected}</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`h-10 px-4 rounded-full border transition-colors font-semibold ${
              filter === value
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
            }`}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {isLoading && (
          <div className="rounded-2xl bg-white border border-blue-100 p-8 text-center text-slate-600">
            Loading products...
          </div>
        )}

        {!isLoading && filteredProducts.map((product) => {
          const status = product.approvalStatus ?? 'pending';
          return (
            <article key={product._id} className="rounded-2xl bg-white border border-blue-100 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900">{product.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Vendor: {product.vendorId?.name ?? product.vendorId?.email ?? 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-500">₹{product.price.toFixed(2)} • {product.category} • {product.waterType}</p>
                  <p className="text-xs mt-2 font-semibold text-blue-700 uppercase tracking-wider">{status}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setApproval(product._id, 'approved')}
                    disabled={status === 'approved'}
                    className="h-9 px-4 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setApproval(product._id, 'rejected')}
                    disabled={status === 'rejected'}
                    className="h-9 px-4 rounded-full border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openEditProduct(product)}
                    className="h-9 px-4 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="h-9 px-4 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="rounded-2xl bg-white border border-blue-100 p-8 text-center text-slate-600">
            No products for this filter.
          </div>
        )}
      </div>

      {editingProduct && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-blue-100">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Edit Product</p>
                <h2 className="text-2xl font-black tracking-tight">{editingProduct.title}</h2>
              </div>
              <button
                type="button"
                onClick={closeEditProduct}
                className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Title"
                  value={editForm.title}
                  onChange={(event) => setEditForm((current) => current ? { ...current, title: event.target.value } : current)}
                />
                <input
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Scientific name"
                  value={editForm.scientific}
                  onChange={(event) => setEditForm((current) => current ? { ...current, scientific: event.target.value } : current)}
                />
                <input
                  type="number"
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Price"
                  value={editForm.price}
                  onChange={(event) => setEditForm((current) => current ? { ...current, price: event.target.value } : current)}
                />
                <input
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tag"
                  value={editForm.tag}
                  onChange={(event) => setEditForm((current) => current ? { ...current, tag: event.target.value } : current)}
                />

                <select
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.category}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, category: event.target.value, subcategory: '' }
                        : current
                    )
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.subcategory}
                  onChange={(event) => setEditForm((current) => current ? { ...current, subcategory: event.target.value } : current)}
                  disabled={!getSubcategoriesForCategory(editForm.category).length}
                >
                  <option value="">Subcategory</option>
                  {getSubcategoriesForCategory(editForm.category).map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>

                <select
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.waterType}
                  onChange={(event) => setEditForm((current) => current ? { ...current, waterType: event.target.value } : current)}
                >
                  <option value="Freshwater">Freshwater</option>
                  <option value="Saltwater">Saltwater</option>
                  <option value="Brackish">Brackish</option>
                </select>

                <select
                  className="h-11 px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.approvalStatus}
                  onChange={(event) => setEditForm((current) => current ? { ...current, approvalStatus: event.target.value as EditFormState['approvalStatus'] } : current)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <label className="flex items-center gap-3 h-11 px-4 rounded-xl border border-blue-200 bg-white">
                  <input
                    type="checkbox"
                    checked={editForm.inStock}
                    onChange={(event) => setEditForm((current) => current ? { ...current, inStock: event.target.checked } : current)}
                    className="h-4 w-4 rounded border-blue-300"
                  />
                  <span className="text-sm font-medium text-slate-700">In stock</span>
                </label>
              </div>

              <textarea
                className="w-full min-h-32 px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description"
                value={editForm.description}
                onChange={(event) => setEditForm((current) => current ? { ...current, description: event.target.value } : current)}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-bold text-slate-900">Product Images</p>
                    <p className="text-sm text-slate-500">Add, remove, or replace images with Cloudinary.</p>
                  </div>

                  <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'}
                    options={{
                      sources: ['local', 'camera', 'url'],
                      multiple: false,
                      resourceType: 'image',
                    }}
                    onSuccess={(result: any) => {
                      const secureUrl = result?.info?.secure_url;
                      if (secureUrl) {
                        addEditImage(String(secureUrl));
                      }
                    }}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="h-10 px-4 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50"
                      >
                        Add Image
                      </button>
                    )}
                  </CldUploadWidget>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {editForm.images.map((image) => (
                    <div key={image} className="relative aspect-square rounded-2xl overflow-hidden border border-blue-100 bg-slate-50">
                      <img src={image} alt="Product preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeEditImage(image)}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-slate-950"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {editForm.images.length === 0 && (
                  <p className="text-sm text-rose-600 font-medium">Add at least one image to save the product.</p>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditProduct}
                  className="h-11 px-5 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditedProduct}
                  disabled={isSavingEdit}
                  className="h-11 px-5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
