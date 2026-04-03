"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

export default function VendorProductsPage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);

  const loadProducts = async () => {
    try {
      const response = (await apiClient.getProducts()) as { products: MarketplaceProduct[] };
      setProducts(response.products ?? []);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteProduct(id);
      loadProducts();
    } catch {
      // keep MVP simple
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Inventory</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Your Products</h1>
        </div>
        <Link href="/vendor/add-product" className="h-11 px-6 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors inline-flex items-center">
          Add Product
        </Link>
      </div>

      <div className="rounded-2xl bg-white border border-blue-100 overflow-hidden">
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
                <td className="px-5 py-4 text-slate-900">${product.price.toFixed(2)}</td>
                <td className="px-5 py-4 text-slate-600">{product.inStock ? 'In stock' : 'Out of stock'}</td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="h-9 px-4 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
