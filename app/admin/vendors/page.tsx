"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { X, Save, ShieldAlert, Truck, CheckSquare, Square, Settings, Percent, Copy, Sliders, CheckCircle2, Layers, Gift, KeyRound, Eye, EyeOff, RefreshCw, Check } from 'lucide-react';

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

  // Password Reset Modal State
  const [resetVendor, setResetVendor] = useState<Vendor | null>(null);
  const [newVendorPassword, setNewVendorPassword] = useState('');
  const [showVendorPassword, setShowVendorPassword] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

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
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState<number | string>(599);
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
        setFreeShippingEnabled(configRes.freeShippingEnabled !== false);
        setFreeShippingMinAmount(configRes.freeShippingMinAmount ?? 599);
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

  // Password Reset Helpers
  const generateRandomPasswordString = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pwd = '';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const special = '!@#$%&*';
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 6; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    return pwd.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const openResetPasswordModal = (vendor: Vendor) => {
    setResetVendor(vendor);
    setShowVendorPassword(true);
    setCopiedPassword(false);
    setNewVendorPassword(generateRandomPasswordString());
  };

  const generateRandomPassword = () => {
    setNewVendorPassword(generateRandomPasswordString());
    setCopiedPassword(false);
  };

  const copyPasswordToClipboard = async () => {
    if (!newVendorPassword) return;
    try {
      await navigator.clipboard.writeText(newVendorPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveVendorPassword = async () => {
    if (!resetVendor) return;
    if (!newVendorPassword || newVendorPassword.trim().length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsResettingPassword(true);
      setMessage(null);
      const res = (await apiClient.resetVendorPassword(resetVendor._id, newVendorPassword.trim())) as any;
      setMessage(res?.message || `Password for ${resetVendor.name} (${resetVendor.email}) reset successfully!`);
      setResetVendor(null);
      setNewVendorPassword('');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to reset vendor password');
    } finally {
      setIsResettingPassword(false);
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
      
      setMessage(`Shipping rates updated for ${selectedVendor.name}`);
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
        freeShippingMinAmount: parseFloat(String(freeShippingMinAmount)) || 599,
      });

      setMessage(`Free Shipping rule saved: ${freeShippingEnabled ? `Enabled (Min ₹${freeShippingMinAmount} on all orders)` : 'Disabled'}`);
    } catch {
      setMessage('Failed to update Free Shipping configuration');
    } finally {
      setIsSavingFreeShipping(false);
    }
  };

  const pendingCount = vendors.filter((vendor) => !vendor.isApproved).length;
  const approvedCount = vendors.filter((vendor) => vendor.isApproved).length;

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendors & Shipping Control</h1>
          <p className="text-xs text-slate-500 mt-1">Manage vendor accounts, regional weight rates, and global free shipping thresholds.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowBulkModal(true)}
            className="h-9 px-4 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5" />
            Bulk Shipping Manager
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Vendors</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{vendors.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Free Shipping Rule</p>
          <p className="text-xs font-semibold text-slate-900 mt-2 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${freeShippingEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            {freeShippingEnabled ? `≥ ₹${freeShippingMinAmount}` : 'Disabled'}
          </p>
        </div>
      </section>

      {/* Notification Toast */}
      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-900 text-white px-4 py-3 text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white font-bold ml-4">Dismiss</button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-xs">
        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          {selectedVendorIds.length === vendors.length && vendors.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-slate-900" />
          ) : (
            <Square className="h-4 w-4 text-slate-300" />
          )}
          <span>Select All ({selectedVendorIds.length}/{vendors.length})</span>
        </button>

        {selectedVendorIds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600">{selectedVendorIds.length} vendor(s) selected</span>
            <button
              onClick={() => {
                setBulkTargetScope('selected');
                setShowBulkModal(true);
              }}
              className="h-8 px-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Apply Action to Selected
            </button>
          </div>
        )}
      </div>

      {/* Vendors Table / List */}
      <div className="space-y-3">
        {vendors.map((vendor) => {
          const isSelected = selectedVendorIds.includes(vendor._id);
          const baseNorth = vendor.shippingRatesNorth?.slab500g ?? 0;
          const baseSouth = vendor.shippingRatesSouth?.slab500g ?? 0;

          return (
            <article
              key={vendor._id}
              className={`rounded-xl bg-white border p-4 sm:p-5 transition-all shadow-xs ${
                isSelected ? 'border-slate-400 bg-slate-50/50' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSelectVendor(vendor._id)}
                    className="mt-0.5 text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-slate-900" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-semibold text-slate-900 text-sm">{vendor.name}</h3>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        vendor.isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {vendor.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">{vendor.email} {vendor.phone ? `• ${vendor.phone}` : ''}</p>

                    {/* Inline Rate Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-md">
                        North: <strong className="text-slate-900 font-semibold">₹{baseNorth}</strong> (500g)
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-md">
                        South: <strong className="text-slate-900 font-semibold">₹{baseSouth}</strong> (500g)
                      </span>
                      {vendor.nonServiceableStates && vendor.nonServiceableStates.length > 0 && (
                        <span className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          {vendor.nonServiceableStates.length} Excluded States
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => openShippingModal(vendor)}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-500" />
                    Configure Shipping
                  </button>

                  <button
                    onClick={() => openResetPasswordModal(vendor)}
                    className="h-8 px-3 rounded-lg border border-amber-200 bg-amber-50/60 text-amber-800 font-medium text-xs hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Reset vendor password"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                    Reset Password
                  </button>

                  <button
                    onClick={() => updateVendor(vendor._id, 'approve')}
                    disabled={isUpdating || vendor.isApproved}
                    className="h-8 px-3 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {vendor.isApproved ? 'Approved' : 'Approve'}
                  </button>

                  <button
                    onClick={() => updateVendor(vendor._id, 'reject')}
                    disabled={isUpdating}
                    className="h-8 px-3 rounded-lg border border-rose-200 text-rose-600 font-medium text-xs hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {vendors.length === 0 && (
          <div className="rounded-xl bg-white border border-slate-200/80 p-8 text-center text-xs text-slate-500 font-medium">
            No vendors found.
          </div>
        )}
      </div>

      {/* 🛠️ BULK SHIPPING MANAGER MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bulk Shipping Manager</h2>
                <p className="text-xs text-slate-500 mt-0.5">Batch update shipping rates across vendors</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Target Vendors:</span>
                <select
                  value={bulkTargetScope}
                  onChange={(e) => setBulkTargetScope(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 outline-none"
                >
                  <option value="all">All Vendors ({vendors.length})</option>
                  <option value="approvedOnly">Approved Vendors Only ({approvedCount})</option>
                  <option value="selected">Selected ({selectedVendorIds.length})</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Region:</span>
                <select
                  value={bulkRegion}
                  onChange={(e) => setBulkRegion(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 outline-none"
                >
                  <option value="both">Both North & South</option>
                  <option value="North">North India Only</option>
                  <option value="South">South India Only</option>
                </select>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto hide-scrollbar shrink-0">
              {[
                { id: 'fixed', label: 'Fixed Rates', icon: Sliders },
                { id: 'adjust', label: 'Price Adjustment', icon: Percent },
                { id: 'copy', label: 'Region Sync', icon: Copy },
                { id: 'serviceability', label: 'Serviceability', icon: ShieldAlert },
                { id: 'freeShipping', label: 'Free Shipping Rule', icon: Gift },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBulkTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                    bulkTab === tab.id
                      ? 'border-slate-900 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* FIXED RATES */}
              {bulkTab === 'fixed' && (
                <div className="space-y-5">
                  <p className="text-xs text-slate-500 font-medium">Set uniform rate slabs for targeted vendors.</p>

                  {(bulkRegion === 'North' || bulkRegion === 'both') && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">North India Rates</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {SLABS.map(s => (
                          <div key={s.key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase">{s.label}</label>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={bulkRatesNorth[s.key] ?? ''}
                                onChange={(e) => setBulkRatesNorth({ ...bulkRatesNorth, [s.key]: parseFloat(e.target.value) || 0 })}
                                className="w-full text-xs font-semibold outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(bulkRegion === 'South' || bulkRegion === 'both') && (
                    <div className="space-y-3 pt-2">
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500">South India Rates</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {SLABS.map(s => (
                          <div key={s.key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase">{s.label}</label>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={bulkRatesSouth[s.key] ?? ''}
                                onChange={(e) => setBulkRatesSouth({ ...bulkRatesSouth, [s.key]: parseFloat(e.target.value) || 0 })}
                                className="w-full text-xs font-semibold outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ADJUSTMENT */}
              {bulkTab === 'adjust' && (
                <div className="space-y-4 max-w-lg">
                  <p className="text-xs text-slate-500 font-medium">Add or subtract a flat ₹ amount from existing vendor shipping rates across slabs.</p>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Flat Amount Offset (₹)</label>
                    <input
                      type="number"
                      value={bulkAdjustAmount}
                      onChange={(e) => setBulkAdjustAmount(e.target.value)}
                      placeholder="e.g. 20 or -10"
                      className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold outline-none focus:border-slate-400 w-full mt-1.5"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Positive values increase rates (+₹20); negative values discount (-₹10).</p>
                  </div>
                </div>
              )}

              {/* REGION SYNC */}
              {bulkTab === 'copy' && (
                <div className="space-y-3 max-w-lg">
                  <p className="text-xs text-slate-500 font-medium">Copy rates between regions for all targeted vendors.</p>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="copyDir"
                      checked={bulkCopyDirection === 'northToSouth'}
                      onChange={() => setBulkCopyDirection('northToSouth')}
                      className="w-4 h-4 text-slate-900"
                    />
                    <span>Copy North Rates → South Region</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="copyDir"
                      checked={bulkCopyDirection === 'southToNorth'}
                      onChange={() => setBulkCopyDirection('southToNorth')}
                      className="w-4 h-4 text-slate-900"
                    />
                    <span>Copy South Rates → North Region</span>
                  </label>
                </div>
              )}

              {/* SERVICEABILITY */}
              {bulkTab === 'serviceability' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-medium text-slate-800">
                      <span>Deliver to North India</span>
                      <input
                        type="checkbox"
                        checked={bulkDeliverNorth}
                        onChange={(e) => setBulkDeliverNorth(e.target.checked)}
                        className="w-4 h-4 rounded text-slate-900"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-medium text-slate-800">
                      <span>Deliver to South India</span>
                      <input
                        type="checkbox"
                        checked={bulkDeliverSouth}
                        onChange={(e) => setBulkDeliverSouth(e.target.checked)}
                        className="w-4 h-4 rounded text-slate-900"
                      />
                    </label>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-slate-900 text-xs">Excluded States</h4>
                    <div className="max-h-[200px] overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 custom-scrollbar pt-1">
                      {INDIAN_STATES.map((state) => (
                        <label key={`bulk-${state}`} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={bulkNonServiceableStates.includes(state)}
                            onChange={() => setBulkNonServiceableStates(prev => prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state])}
                            className="w-3.5 h-3.5 rounded text-slate-900"
                          />
                          <span>{state}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FREE SHIPPING RULE */}
              {bulkTab === 'freeShipping' && (
                <div className="space-y-4 max-w-lg">
                  <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-slate-900" />
                        <h4 className="font-semibold text-slate-900 text-sm">Storewide Free Shipping Threshold (₹599+)</h4>
                      </div>
                      <input
                        type="checkbox"
                        checked={freeShippingEnabled}
                        onChange={(e) => setFreeShippingEnabled(e.target.checked)}
                        className="h-4 w-4 rounded text-slate-900 cursor-pointer"
                      />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Automatically grant <strong>FREE (₹0) Shipping</strong> on all orders meeting or exceeding the minimum subtotal, <strong>including orders with items from multiple different vendors</strong>.
                    </p>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Minimum Order Subtotal (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={freeShippingMinAmount}
                        onChange={(e) => setFreeShippingMinAmount(e.target.value)}
                        className="h-9 px-3 rounded-lg border border-slate-200 bg-white font-bold text-sm text-slate-900 outline-none w-full mt-1"
                      />
                    </div>

                    <button
                      onClick={saveFreeShippingConfig}
                      disabled={isSavingFreeShipping}
                      className="h-9 px-4 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {isSavingFreeShipping ? 'Saving...' : 'Save Free Shipping Setting'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {bulkTab !== 'freeShipping' && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Targeting {bulkTargetScope === 'all' ? `All ${vendors.length} vendors` : bulkTargetScope === 'approvedOnly' ? `Approved ${approvedCount} vendors` : `${selectedVendorIds.length} selected vendors`}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setShowBulkModal(false)} className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={saveBulkShipping} disabled={isSavingBulk} className="h-9 px-5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900">Configure Shipping Rates</h2>
                <p className="text-xs text-slate-500 mt-0.5">Editing {selectedVendor.name}</p>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 text-xs font-medium text-slate-600">
              <span>Presets:</span>
              <button onClick={() => applyPresetIndividual('default')} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-xs">
                Standard Rates (₹120 / ₹80)
              </button>
              <button onClick={() => applyPresetIndividual('copyNorthToSouth')} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-xs">
                North → South
              </button>
              <button onClick={() => applyPresetIndividual('copySouthToNorth')} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-xs">
                South → North
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                {/* North */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-700">North India</h3>
                    <input type="checkbox" checked={deliverNorth} onChange={(e) => setDeliverNorth(e.target.checked)} className="h-4 w-4 text-slate-900 rounded" />
                  </div>
                  {deliverNorth && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {SLABS.map((slab) => (
                        <div key={slab.key} className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">{slab.label}</label>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-slate-400 text-xs">₹</span>
                            <input type="number" min="0" value={ratesNorth[slab.key] ?? ''} onChange={(e) => handleRateChange('North', slab.key, e.target.value)} className="w-full text-xs font-semibold bg-transparent outline-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* South */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-700">South India</h3>
                    <input type="checkbox" checked={deliverSouth} onChange={(e) => setDeliverSouth(e.target.checked)} className="h-4 w-4 text-slate-900 rounded" />
                  </div>
                  {deliverSouth && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {SLABS.map((slab) => (
                        <div key={slab.key} className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">{slab.label}</label>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-slate-400 text-xs">₹</span>
                            <input type="number" min="0" value={ratesSouth[slab.key] ?? ''} onChange={(e) => handleRateChange('South', slab.key, e.target.value)} className="w-full text-xs font-semibold bg-transparent outline-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Excluded States */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-700 mb-3 border-b border-slate-100 pb-2">Non-Serviceable States</h3>
                <div className="max-h-[320px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {INDIAN_STATES.map((state) => (
                    <label key={state} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs text-slate-700">
                      <input type="checkbox" checked={nonServiceableStates.includes(state)} onChange={() => toggleState(state)} className="h-3.5 w-3.5 rounded text-slate-900" />
                      <span>{state}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setSelectedVendor(null)} className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={saveShipping} disabled={isSavingShipping} className="h-9 px-5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer">
                {isSavingShipping ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔑 RESET PASSWORD MODAL */}
      {resetVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Reset Vendor Password</h2>
                  <p className="text-[11px] text-slate-500">Set a new login password for this vendor</p>
                </div>
              </div>
              <button
                onClick={() => setResetVendor(null)}
                className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Vendor Info card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Vendor:</span>
                  <span className="text-slate-900 font-semibold">{resetVendor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email / Login ID:</span>
                  <span className="text-slate-900 font-mono font-medium">{resetVendor.email}</span>
                </div>
              </div>

              {/* Password Input Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Generate Strong
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showVendorPassword ? "text" : "password"}
                    value={newVendorPassword}
                    onChange={(e) => setNewVendorPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full h-10 px-3.5 pr-20 rounded-xl border border-slate-200 bg-white font-mono text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowVendorPassword(!showVendorPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title={showVendorPassword ? "Hide password" : "Show password"}
                    >
                      {showVendorPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={copyPasswordToClipboard}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {copiedPassword ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {copiedPassword && (
                  <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <Check className="h-3 w-3" /> Copied password to clipboard!
                  </p>
                )}
              </div>

              {/* Warning Notice */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
                <span className="font-semibold">Important:</span> This will overwrite the vendor's password immediately. Please make sure to copy and send this new password to the vendor.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetVendor(null)}
                className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVendorPassword}
                disabled={isResettingPassword || !newVendorPassword || newVendorPassword.trim().length < 6}
                className="h-9 px-5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isResettingPassword ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Set New Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
