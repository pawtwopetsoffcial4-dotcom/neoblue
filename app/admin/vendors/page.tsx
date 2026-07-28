"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { X, Save, ShieldAlert } from 'lucide-react';

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
  shippingRatesSouth?: Record<string, number>;
  shippingRatesNorth?: Record<string, number>;
  nonServiceableStates?: string[];
  deliverNorth?: boolean;
  deliverSouth?: boolean;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Modal State
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [ratesSouth, setRatesSouth] = useState<Record<string, number>>({});
  const [ratesNorth, setRatesNorth] = useState<Record<string, number>>({});
  const [nonServiceableStates, setNonServiceableStates] = useState<string[]>([]);
  const [deliverNorth, setDeliverNorth] = useState(true);
  const [deliverSouth, setDeliverSouth] = useState(true);
  const [isSavingShipping, setIsSavingShipping] = useState(false);

  const SLABS = [
    { key: 'slab500g', label: '500 gm' },
    { key: 'slab1kg', label: '1 kg' },
    { key: 'slab2kg', label: '2 kg' },
    { key: 'slab3kg', label: '3 kg' },
    { key: 'slab5kg', label: '5 kg' },
    { key: 'slab10kg', label: '10 kg' },
  ];

  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

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

  const openShippingModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setRatesSouth(vendor.shippingRatesSouth || { slab500g: 0, slab1kg: 0, slab2kg: 0, slab3kg: 0, slab5kg: 0, slab10kg: 0 });
    setRatesNorth(vendor.shippingRatesNorth || { slab500g: 0, slab1kg: 0, slab2kg: 0, slab3kg: 0, slab5kg: 0, slab10kg: 0 });
    setNonServiceableStates(vendor.nonServiceableStates || []);
    setDeliverNorth(vendor.deliverNorth !== false);
    setDeliverSouth(vendor.deliverSouth !== false);
  };

  const handleRateChange = (region: 'North' | 'South', key: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (region === 'North') {
      setRatesNorth(prev => ({ ...prev, [key]: numValue }));
    } else {
      setRatesSouth(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const toggleState = (stateName: string) => {
    setNonServiceableStates(prev => 
      prev.includes(stateName) 
        ? prev.filter(s => s !== stateName)
        : [...prev, stateName]
    );
  };

  const saveShipping = async () => {
    if (!selectedVendor) return;
    try {
      setIsSavingShipping(true);
      setMessage(null);
      const dataToSave = {
        shippingRatesSouth: ratesSouth,
        shippingRatesNorth: ratesNorth,
        nonServiceableStates,
        deliverNorth,
        deliverSouth
      };
      
      await apiClient.updateVendorShipping(selectedVendor._id, dataToSave);
      
      setVendors(current =>
        current.map(v => v._id === selectedVendor._id ? { ...v, ...dataToSave } : v)
      );
      
      setMessage(`Shipping configured successfully for ${selectedVendor.name}`);
      setSelectedVendor(null);
    } catch {
      setMessage('Failed to save shipping configuration');
    } finally {
      setIsSavingShipping(false);
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openShippingModal(vendor)}
                  className="h-10 px-4 rounded-full border border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
                >
                  Configure Shipping
                </button>
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

      {/* Shipping Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10 rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Configure Shipping</h2>
                <p className="text-sm text-slate-500 mt-1">Editing settings for {selectedVendor.name}</p>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* North India */}
                <div className="rounded-3xl border border-slate-100 bg-[#F8FAFC] p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-200/50 pb-3">
                    <div>
                      <h3 className="font-black text-slate-900">North India</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input type="checkbox" checked={deliverNorth} onChange={(e) => setDeliverNorth(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {deliverNorth && (
                    <div className="grid grid-cols-2 gap-4">
                      {SLABS.map((slab) => (
                        <div key={slab.key} className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{slab.label}</label>
                          <div className="relative flex items-center mt-1">
                            <span className="absolute left-3 text-slate-400 font-extrabold text-sm">₹</span>
                            <input type="number" min="0" value={ratesNorth[slab.key] || ''} onChange={(e) => handleRateChange('North', slab.key, e.target.value)} className="w-full h-9 pl-7 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/30" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* South India */}
                <div className="rounded-3xl border border-slate-100 bg-[#F8FAFC] p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-200/50 pb-3">
                    <div>
                      <h3 className="font-black text-slate-900">South India</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input type="checkbox" checked={deliverSouth} onChange={(e) => setDeliverSouth(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                  {deliverSouth && (
                    <div className="grid grid-cols-2 gap-4">
                      {SLABS.map((slab) => (
                        <div key={slab.key} className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{slab.label}</label>
                          <div className="relative flex items-center mt-1">
                            <span className="absolute left-3 text-slate-400 font-extrabold text-sm">₹</span>
                            <input type="number" min="0" value={ratesSouth[slab.key] || ''} onChange={(e) => handleRateChange('South', slab.key, e.target.value)} className="w-full h-9 pl-7 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/30" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Non Serviceable */}
              <div>
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                    <ShieldAlert className="h-5 w-5 text-rose-500" />
                    <div>
                      <h3 className="font-black text-slate-900">Non-Serviceable</h3>
                      <p className="text-xs text-slate-500">Select restricted states</p>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 mt-4 custom-scrollbar">
                    {INDIAN_STATES.map((state) => (
                      <label key={state} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                        <input type="checkbox" checked={nonServiceableStates.includes(state)} onChange={() => toggleState(state)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{state}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <button onClick={() => setSelectedVendor(null)} className="h-11 px-6 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={saveShipping} disabled={isSavingShipping} className="h-11 px-8 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" />
                {isSavingShipping ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
