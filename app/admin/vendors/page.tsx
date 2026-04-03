"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

type Vendor = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: Array<{
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  }>;
  isApproved: boolean;
  createdAt: string;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadVendors = async () => {
    try {
      const response = (await apiClient.getVendors()) as { vendors: Vendor[] };
      setVendors(response.vendors ?? []);
    } catch {
      setVendors([]);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const updateVendor = async (vendorId: string, action: 'approve' | 'reject') => {
    try {
      setIsUpdating(true);
      setMessage(null);
      const response = (await apiClient.updateVendorStatus(vendorId, action)) as { message?: string; vendor?: Vendor };

      setVendors((current) =>
        current.map((vendor) =>
          vendor._id === vendorId
            ? {
                ...vendor,
                isApproved: response.vendor?.isApproved ?? (action === 'approve'),
              }
            : vendor
        )
      );

      setMessage(response.message || `Vendor ${action}d successfully`);
    } catch {
      setMessage('Failed to update vendor approval status');
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingCount = vendors.filter((vendor) => !vendor.isApproved).length;
  const approvedCount = vendors.filter((vendor) => vendor.isApproved).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Approvals</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Vendor Requests</h1>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Approved</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{approvedCount}</p>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {vendors.map((vendor) => (
          <article key={vendor._id} className="rounded-2xl bg-white border border-blue-100 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900">{vendor.name}</p>
                <p className="text-sm text-slate-500 mt-1">{vendor.email}</p>
                {vendor.phone && <p className="text-sm text-slate-600 mt-1">Phone: {vendor.phone}</p>}
                {vendor.addresses?.[0] && (
                  <p className="text-sm text-slate-600 mt-1">
                    Address: {vendor.addresses[0].street}, {vendor.addresses[0].city}, {vendor.addresses[0].state} {vendor.addresses[0].zipcode}
                  </p>
                )}
                <p className="text-xs mt-2 font-semibold text-blue-700">
                  {vendor.isApproved ? 'Approved' : 'Pending approval'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateVendor(vendor._id, 'approve')}
                  disabled={isUpdating || vendor.isApproved}
                  className="h-10 px-4 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {vendor.isApproved ? 'Approved' : isUpdating ? 'Updating...' : 'Approve'}
                </button>
                <button
                  onClick={() => updateVendor(vendor._id, 'reject')}
                  disabled={isUpdating}
                  className="h-10 px-4 rounded-full border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Reject'}
                </button>
              </div>
            </div>
          </article>
        ))}

        {vendors.length === 0 && (
          <div className="rounded-2xl bg-white border border-blue-100 p-8 text-center text-slate-600">
            No vendors found.
          </div>
        )}
      </div>
    </div>
  );
}
