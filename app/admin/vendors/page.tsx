"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { X, Save, ShieldAlert, Zap, Truck, CheckSquare, Square, Settings, Percent, Copy, Sliders, CheckCircle2 } from 'lucide-react';

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
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Individual Shipping Modal State
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [ratesSouth, setRatesSouth] = useState<Record<string, number>>({});
  const [ratesNorth, setRatesNorth] = useState<Record<string, number>>({});
  const [nonServiceableStates, setNonServiceableStates] = useState<string[]>([]);
  const [deliverNorth, setDeliverNorth] = useState(true);
  const [deliverSouth, setDeliverSouth] = useState(true);
  const [isSavingShipping, setIsSavingShipping] = useState(false);

  // Bulk Shipping Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTab, setBulkTab] = useState<'fixed' | 'adjust' | 'copy' | 'serviceability' | 'freeShipping'>('fixed');
  const [bulkTargetScope, setBulkTargetScope] = useState<'all' | 'approvedOnly' | 'selected'>('all');
  const [bulkRegion, setBulkRegion] = useState<'North' | 'South' | 'both'>('both');
  const [bulkRatesNorth, setBulkRatesNorth] = useState<Record<string, number>>({ slab500g: 120, slab1kg: 180, slab2kg: 250, slab3kg: 320, slab5kg: 450, slab10kg: 750 });
  const [bulkRatesSouth, setBulkRatesSouth] = useState<Record<string, number>>({ slab500g: 80, slab1kg: 120, slab2kg: 180, slab3kg: 240, slab5kg: 350, slab10kg: 600 });
  const [bulkAdjustAmount, setBulkAdjustAmount] = useState<string>('20');
  const [bulkAdjustPercent, setBulkAdjustPercent] = useState<string>('10');
  const [bulkCopyDirection, setBulkCopyDirection] = useState<'northToSouth' | 'southToNorth'>('northToSouth');
  const [bulkDeliverNorth, setBulkDeliverNorth] = useState(true);
  const [bulkDeliverSouth, setBulkDeliverSouth] = useState(true);
  const [bulkNonServiceableStates, setBulkNonServiceableStates] = useState<string[]>([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // Free Shipping Threshold Config State
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState<number | string>(1499);
  const [isSavingFreeShipping, setIsSavingFreeShipping] = useState(false);

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

  const loadVendorsAndConfig = async () => {
    try {
      const response = (await apiClient.getVendors()) as { vendors: Vendor[] };
      setVendors(response.vendors ?? []);

      const configRes = (await apiClient.getStoreConfig()) as any;
      if (configRes) {
        setFreeShippingEnabled(Boolean(configRes.freeShippingEnabled));
        setFreeShippingMinAmount(configRes.freeShippingMinAmount ?? 1499);
      }
    } catch {
      setVendors([]);
    }
  };

  useEffect(() => {
    loadVendorsAndConfig();
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

  // Checkbox Selection Helpers
  const toggleSelectVendor = (vendorId: string) => {
    setSelectedVendorIds(prev =>
      prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVendorIds.length === vendors.length) {
      setSelectedVendorIds([]);
    } else {
      setSelectedVendorIds(vendors.map(v => v._id));
    }
  };

  // Individual Shipping Modal Helpers
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

  // Preset shortcuts for individual shipping
  const applyPresetIndividual = (type: 'default' | 'copyNorthToSouth' | 'copySouthToNorth') => {
    if (type === 'default') {
      setRatesNorth({ slab500g: 120, slab1kg: 180, slab2kg: 250, slab3kg: 320, slab5kg: 450, slab10kg: 750 });
      setRatesSouth({ slab500g: 80, slab1kg: 120, slab2kg: 180, slab3kg: 240, slab5kg: 350, slab10kg: 600 });
    } else if (type === 'copyNorthToSouth') {
      setRatesSouth({ ...ratesNorth });
    } else if (type === 'copySouthToNorth') {
      setRatesNorth({ ...ratesSouth });
    }
  };

  // Bulk Shipping Submission
  const saveBulkShipping = async () => {
    try {
      setIsSavingBulk(true);
      setMessage(null);

      const payload: any = {
        actionType: bulkTab,
        targetScope: bulkTargetScope,
        vendorIds: bulkTargetScope === 'selected' ? selectedVendorIds : undefined,
        region: bulkRegion,
      };

      if (bulkTab === 'fixed') {
        payload.ratesNorth = bulkRatesNorth;
        payload.ratesSouth = bulkRatesSouth;
      } else if (bulkTab === 'adjust') {
        payload.adjustAmount = parseFloat(bulkAdjustAmount) || 0;
      } else if (bulkTab === 'copy') {
        payload.copyDirection = bulkCopyDirection;
      } else if (bulkTab === 'serviceability') {
        payload.deliverNorth = bulkDeliverNorth;
        payload.deliverSouth = bulkDeliverSouth;
        payload.nonServiceableStates = bulkNonServiceableStates;
      }

      const res = (await apiClient.bulkUpdateVendorShipping(payload)) as any;
      setMessage(res?.message || 'Bulk shipping updated successfully');
      setShowBulkModal(false);
      await loadVendorsAndConfig();
    } catch (err: any) {
      setMessage(err?.message || 'Failed to apply bulk shipping update');
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Save Free Shipping Config
  const saveFreeShippingConfig = async () => {
    try {
      setIsSavingFreeShipping(true);
      setMessage(null);

      await apiClient.updateStoreConfig({
        freeShippingEnabled,
        freeShippingMinAmount: parseFloat(String(freeShippingMinAmount)) || 1499,
      });

      setMessage(`Free Shipping rule saved: ${freeShippingEnabled ? `Enabled (Min ₹${freeShippingMinAmount} for single-seller order)` : 'Disabled'}`);
    } catch {
      setMessage('Failed to update Free Shipping configuration');
    } finally {
      setIsSavingFreeShipping(false);
    }
  };

  const pendingCount = vendors.filter((vendor) => !vendor.isApproved).length;
  const approvedCount = vendors.filter((vendor) => vendor.isApproved).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Bulk Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Shipping & Approvals</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Vendor Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="h-11 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
            Bulk Shipping Manager
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Vendors</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{vendors.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5 shadow-2xs">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Approval</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-2xs">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved Vendors</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{approvedCount}</p>
        </div>
      </section>

      {/* Notification Message */}
      {message && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-800 flex items-center justify-between shadow-2xs">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-blue-500 hover:text-blue-700 font-bold">Dismiss</button>
        </div>
      )}

      {/* Vendor Table Actions Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 px-5 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer"
          >
            {selectedVendorIds.length === vendors.length && vendors.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            Select All ({selectedVendorIds.length}/{vendors.length})
          </button>
        </div>

        {selectedVendorIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600">{selectedVendorIds.length} selected</span>
            <button
              onClick={() => {
                setBulkTargetScope('selected');
                setShowBulkModal(true);
              }}
              className="h-8 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors"
            >
              Bulk Action on Selected
            </button>
          </div>
        )}
      </div>

      {/* Vendors List */}
      <div className="space-y-3">
        {vendors.map((vendor) => {
          const isSelected = selectedVendorIds.includes(vendor._id);
          const baseNorth = vendor.shippingRatesNorth?.slab500g ?? 0;
          const baseSouth = vendor.shippingRatesSouth?.slab500g ?? 0;

          return (
            <article
              key={vendor._id}
              className={`rounded-2xl bg-white border transition-all duration-200 p-5 ${
                isSelected ? 'border-blue-400 bg-blue-50/20 ring-1 ring-blue-400' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSelectVendor(vendor._id)}
                    className="mt-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-300" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-base">{vendor.name}</p>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        vendor.isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {vendor.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">{vendor.email} {vendor.phone ? `• ${vendor.phone}` : ''}</p>

                    {/* Shipping Summary Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Truck className="h-3 w-3 text-blue-600" />
                        North 500g: <strong className="text-slate-900">₹{baseNorth}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Truck className="h-3 w-3 text-orange-600" />
                        South 500g: <strong className="text-slate-900">₹{baseSouth}</strong>
                      </span>
                      {vendor.nonServiceableStates && vendor.nonServiceableStates.length > 0 && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                          {vendor.nonServiceableStates.length} Excluded States
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 ml-8 md:ml-0">
                  <button
                    onClick={() => openShippingModal(vendor)}
                    className="h-10 px-4 rounded-xl border border-blue-200 text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configure Shipping
                  </button>

                  <button
                    onClick={() => updateVendor(vendor._id, 'approve')}
                    disabled={isUpdating || vendor.isApproved}
                    className="h-10 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {vendor.isApproved ? 'Approved' : isUpdating ? 'Updating...' : 'Approve'}
                  </button>

                  <button
                    onClick={() => updateVendor(vendor._id, 'reject')}
                    disabled={isUpdating}
                    className="h-10 px-4 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {vendors.length === 0 && (
          <div className="rounded-2xl bg-white border border-slate-200/80 p-8 text-center text-slate-500 font-medium">
            No vendors found.
          </div>
        )}
      </div>

      {/* ⚡ BULK SHIPPING MANAGER MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-amber-400">
                  <Zap className="h-5 w-5 fill-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white">Bulk Shipping Manager</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manipulate vendor shipping rates all at once across regions and slabs</p>
                </div>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scope Selection Bar */}
            <div className="bg-slate-100/80 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span>Target Vendors:</span>
                <select
                  value={bulkTargetScope}
                  onChange={(e) => setBulkTargetScope(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Vendors ({vendors.length})</option>
                  <option value="approvedOnly">Approved Vendors Only ({approvedCount})</option>
                  <option value="selected">Checkbox Selected ({selectedVendorIds.length})</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span>Region:</span>
                <select
                  value={bulkRegion}
                  onChange={(e) => setBulkRegion(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="both">Both North & South</option>
                  <option value="North">North India Only</option>
                  <option value="South">South India Only</option>
                </select>
              </div>
            </div>

            {/* Bulk Action Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto hide-scrollbar shrink-0">
              {[
                { id: 'fixed', label: 'Fixed Rates', icon: Sliders },
                { id: 'adjust', label: 'Flat / % Adjust', icon: Percent },
                { id: 'copy', label: 'Sync Regions', icon: Copy },
                { id: 'serviceability', label: 'Serviceability', icon: ShieldAlert },
                { id: 'freeShipping', label: '🎁 Free Shipping Rule', icon: Truck },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBulkTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-extrabold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                    bulkTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* TAB 1: FIXED RATES */}
              {bulkTab === 'fixed' && (
                <div className="space-y-6">
                  <p className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded-xl p-3 font-semibold">
                    Set uniform rate slabs across all targeted vendors. Empty or zero values will set free rate for that slab.
                  </p>

                  {(bulkRegion === 'North' || bulkRegion === 'both') && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                      <h4 className="font-bold text-slate-900 text-sm mb-3">North India Rates</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {SLABS.map(s => (
                          <div key={s.key} className="bg-white p-3 rounded-xl border border-slate-200">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</label>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-slate-400 font-bold text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={bulkRatesNorth[s.key] ?? ''}
                                onChange={(e) => setBulkRatesNorth({ ...bulkRatesNorth, [s.key]: parseFloat(e.target.value) || 0 })}
                                className="w-full text-sm font-bold outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(bulkRegion === 'South' || bulkRegion === 'both') && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                      <h4 className="font-bold text-slate-900 text-sm mb-3">South India Rates</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {SLABS.map(s => (
                          <div key={s.key} className="bg-white p-3 rounded-xl border border-slate-200">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</label>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-slate-400 font-bold text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={bulkRatesSouth[s.key] ?? ''}
                                onChange={(e) => setBulkRatesSouth({ ...bulkRatesSouth, [s.key]: parseFloat(e.target.value) || 0 })}
                                className="w-full text-sm font-bold outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FLAT / PERCENT ADJUST */}
              {bulkTab === 'adjust' && (
                <div className="space-y-6 max-w-xl">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-800">
                    Increase or decrease existing shipping rates across slabs for targeted vendors by a flat amount (e.g. +₹20) or percentage (e.g. +10%).
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Flat Amount Adjustment (₹)</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={bulkAdjustAmount}
                          onChange={(e) => setBulkAdjustAmount(e.target.value)}
                          placeholder="e.g. 20 or -15"
                          className="h-10 px-4 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-blue-500 w-full"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Use positive value to increase rates (+₹20) or negative value to discount (-₹15).</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: REGION COPY */}
              {bulkTab === 'copy' && (
                <div className="space-y-6 max-w-xl">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">Copy Rates Between Regions</h4>
                    <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="radio"
                        name="copyDir"
                        checked={bulkCopyDirection === 'northToSouth'}
                        onChange={() => setBulkCopyDirection('northToSouth')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-800">Copy North Rates → South Region for all target vendors</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="radio"
                        name="copyDir"
                        checked={bulkCopyDirection === 'southToNorth'}
                        onChange={() => setBulkCopyDirection('southToNorth')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-800">Copy South Rates → North Region for all target vendors</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 4: GLOBAL SERVICEABILITY */}
              {bulkTab === 'serviceability' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                      <span className="text-sm font-bold text-slate-800">Deliver to North India</span>
                      <input
                        type="checkbox"
                        checked={bulkDeliverNorth}
                        onChange={(e) => setBulkDeliverNorth(e.target.checked)}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                      <span className="text-sm font-bold text-slate-800">Deliver to South India</span>
                      <input
                        type="checkbox"
                        checked={bulkDeliverSouth}
                        onChange={(e) => setBulkDeliverSouth(e.target.checked)}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                    </label>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">Global Non-Serviceable States</h4>
                    <p className="text-xs text-slate-500">Select state restrictions to apply across targeted vendors</p>
                    <div className="max-h-[220px] overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 custom-scrollbar">
                      {INDIAN_STATES.map((state) => (
                        <label key={`bulk-${state}`} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={bulkNonServiceableStates.includes(state)}
                            onChange={() => setBulkNonServiceableStates(prev => prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state])}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span>{state}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: FREE SHIPPING THRESHOLD RULE */}
              {bulkTab === 'freeShipping' && (
                <div className="space-y-6 max-w-xl">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-emerald-600" />
                        <h4 className="font-black text-emerald-950 text-base">Single-Vendor Free Shipping Rule</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={freeShippingEnabled}
                          onChange={(e) => setFreeShippingEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <p className="text-xs text-emerald-900 leading-relaxed font-semibold">
                      When enabled, shipping charges are <strong>FREE (₹0)</strong> for any customer order if <strong>all products in the cart are from the same vendor</strong> and the cart subtotal meets or exceeds the minimum required order amount below.
                    </p>

                    <div>
                      <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Minimum Order Amount (₹)</label>
                      <div className="relative flex items-center mt-1.5">
                        <span className="absolute left-3.5 text-slate-500 font-extrabold text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={freeShippingMinAmount}
                          onChange={(e) => setFreeShippingMinAmount(e.target.value)}
                          className="w-full h-11 pl-8 pr-4 rounded-xl border border-emerald-300 bg-white font-black text-base text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-1 font-medium">Standard default: ₹1,499. Orders below this amount or containing multi-seller items will pay normal rates.</p>
                    </div>

                    <button
                      onClick={saveFreeShippingConfig}
                      disabled={isSavingFreeShipping}
                      className="h-11 px-6 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {isSavingFreeShipping ? 'Saving...' : 'Save Free Shipping Rule'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {bulkTab !== 'freeShipping' && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex items-center justify-between shrink-0">
                <p className="text-xs font-semibold text-slate-500">
                  Targeting: <strong className="text-slate-900">{bulkTargetScope === 'all' ? `All ${vendors.length} vendors` : bulkTargetScope === 'approvedOnly' ? `Approved ${approvedCount} vendors` : `${selectedVendorIds.length} selected vendors`}</strong>
                </p>

                <div className="flex gap-3">
                  <button onClick={() => setShowBulkModal(false)} className="h-11 px-6 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-xs">
                    Cancel
                  </button>
                  <button onClick={saveBulkShipping} disabled={isSavingBulk} className="h-11 px-8 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60 text-xs shadow-md shadow-blue-600/20 cursor-pointer">
                    <Zap className="w-4 h-4 fill-current" />
                    {isSavingBulk ? 'Applying...' : 'Apply Bulk Update'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⚙️ INDIVIDUAL SHIPPING MODAL */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border border-slate-100">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10 rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Configure Shipping</h2>
                <p className="text-sm text-slate-500 mt-1">Editing settings for {selectedVendor.name}</p>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="text-slate-500">Presets:</span>
              <button onClick={() => applyPresetIndividual('default')} className="px-3 py-1 bg-white border border-slate-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors">
                Standard Rates (₹120 / ₹80)
              </button>
              <button onClick={() => applyPresetIndividual('copyNorthToSouth')} className="px-3 py-1 bg-white border border-slate-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors">
                Copy North → South
              </button>
              <button onClick={() => applyPresetIndividual('copySouthToNorth')} className="px-3 py-1 bg-white border border-slate-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors">
                Copy South → North
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* North India */}
                <div className="rounded-3xl border border-slate-100 bg-[#F8FAFC] p-6 shadow-2xs">
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
                            <input type="number" min="0" value={ratesNorth[slab.key] ?? ''} onChange={(e) => handleRateChange('North', slab.key, e.target.value)} className="w-full h-9 pl-7 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/30" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* South India */}
                <div className="rounded-3xl border border-slate-100 bg-[#F8FAFC] p-6 shadow-2xs">
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
                            <input type="number" min="0" value={ratesSouth[slab.key] ?? ''} onChange={(e) => handleRateChange('South', slab.key, e.target.value)} className="w-full h-9 pl-7 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/30" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Non Serviceable */}
              <div>
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xs h-full">
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
              <button onClick={() => setSelectedVendor(null)} className="h-11 px-6 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-xs">
                Cancel
              </button>
              <button onClick={saveShipping} disabled={isSavingShipping} className="h-11 px-8 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60 text-xs shadow-md shadow-blue-600/20 cursor-pointer">
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
