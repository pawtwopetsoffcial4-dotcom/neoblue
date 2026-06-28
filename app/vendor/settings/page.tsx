'use client';

import { useState, useEffect } from 'react';
import { Info, AlertCircle, Save, ShieldAlert } from 'lucide-react';

const SLABS = [
  { key: 'slab500g', label: '500 gm' },
  { key: 'slab1kg', label: '1 kg' },
  { key: 'slab2kg', label: '2 kg' },
  { key: 'slab3kg', label: '3 kg' },
  { key: 'slab5kg', label: '5 kg' },
  { key: 'slab10kg', label: '10 kg' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function VendorShippingSettingsPage() {
  const [ratesSouth, setRatesSouth] = useState<Record<string, number>>({
    slab500g: 0, slab1kg: 0, slab2kg: 0, slab3kg: 0, slab5kg: 0, slab10kg: 0
  });
  const [ratesNorth, setRatesNorth] = useState<Record<string, number>>({
    slab500g: 0, slab1kg: 0, slab2kg: 0, slab3kg: 0, slab5kg: 0, slab10kg: 0
  });
  const [nonServiceableStates, setNonServiceableStates] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/vendor/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        
        if (data.shippingRatesSouth) setRatesSouth(data.shippingRatesSouth);
        if (data.shippingRatesNorth) setRatesNorth(data.shippingRatesNorth);
        if (data.nonServiceableStates) setNonServiceableStates(data.nonServiceableStates);
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to load shipping configurations.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleRateChange = (region: 'North' | 'South', slabKey: string, val: string) => {
    const numericVal = val === '' ? 0 : Math.max(0, Number(val));
    if (region === 'South') {
      setRatesSouth(prev => ({ ...prev, [slabKey]: numericVal }));
    } else {
      setRatesNorth(prev => ({ ...prev, [slabKey]: numericVal }));
    }
  };

  const handleStateToggle = (stateName: string) => {
    setNonServiceableStates(prev => 
      prev.includes(stateName) 
        ? prev.filter(s => s !== stateName) 
        : [...prev, stateName]
    );
  };

  const handleSelectAllStates = () => {
    setNonServiceableStates(INDIAN_STATES);
  };

  const handleClearAllStates = () => {
    setNonServiceableStates([]);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });
      
      const res = await fetch('/api/vendor/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingRatesSouth: ratesSouth,
          shippingRatesNorth: ratesNorth,
          nonServiceableStates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      
      setMessage({ type: 'success', text: 'Shipping configuration saved successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save configurations.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6 text-slate-900 bg-white min-h-screen p-4 sm:p-6 lg:p-8">
      
      {/* Title Header */}
      <div className="border-b border-slate-100 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Shipping Configuration</h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Configure regional weight-slab shipping charges and select non-serviceable delivery regions.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${
          message.type === 'error' 
            ? 'bg-rose-50 text-rose-700 border-rose-100' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
        }`}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Slabs Setup */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* North India Slabs */}
          <div className="rounded-3xl border border-slate-100 bg-[#F8FAFC] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-200/50 pb-3">
              <span className="text-2xl">🏔️</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">North India Rates</h2>
                <p className="text-xs text-slate-500">Configure shipping charges for deliveries within Northern states</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SLABS.map((slab) => (
                <div key={slab.key} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{slab.label}</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 font-extrabold text-sm">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      value={ratesNorth[slab.key] || ''}
                      onChange={(e) => handleRateChange('North', slab.key, e.target.value)}
                      placeholder="0"
                      className="w-full h-10 pl-8 pr-4 rounded-xl border border-slate-200 font-semibold text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50/30"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* South India Slabs */}
          <div className="rounded-3xl border border-slate-100 bg-[#F8FAFC] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-200/50 pb-3">
              <span className="text-2xl">🌴</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">South India Rates</h2>
                <p className="text-xs text-slate-500">Configure shipping charges for deliveries within Southern states</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SLABS.map((slab) => (
                <div key={slab.key} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{slab.label}</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 font-extrabold text-sm">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      value={ratesSouth[slab.key] || ''}
                      onChange={(e) => handleRateChange('South', slab.key, e.target.value)}
                      placeholder="0"
                      className="w-full h-10 pl-8 pr-4 rounded-xl border border-slate-200 font-semibold text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50/30"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Non-Serviceable States Selection */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <div>
                <h2 className="text-lg font-black text-slate-900">Non-Serviceable States</h2>
                <p className="text-xs text-slate-500">Select states where delivery is not available</p>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 mb-4">
              <button 
                type="button" 
                onClick={handleSelectAllStates}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 py-1.5 px-3 rounded-lg transition-colors"
              >
                Restrict All States
              </button>
              <button 
                type="button" 
                onClick={handleClearAllStates}
                className="text-xs font-bold text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/50 py-1.5 px-3 rounded-lg transition-colors"
              >
                Clear Restrictions (Deliver All)
              </button>
            </div>

            <div className="max-h-100 overflow-y-auto border border-slate-100 rounded-2xl p-2 space-y-1 bg-slate-50/50 pr-4">
              {INDIAN_STATES.map((state) => {
                const isRestricted = nonServiceableStates.includes(state);
                return (
                  <button
                    key={state}
                    type="button"
                    onClick={() => handleStateToggle(state)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition-all border ${
                      isRestricted 
                        ? 'bg-rose-50 border-rose-200 text-rose-800' 
                        : 'bg-white border-slate-200/60 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{state}</span>
                    {isRestricted ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-rose-600 uppercase">
                        Not Deliverable
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 uppercase">
                        Serviceable
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <p className="text-[10px] text-slate-400 font-semibold mt-3.5 leading-relaxed">
              * Delivery configurations are applied automatically during checkout based on the buyer's shipping address.
            </p>
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 pb-12 border-t border-slate-100">
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-8 font-black text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving configs...' : 'Save Shipping Settings'}
        </button>
      </div>

    </div>
  );
}