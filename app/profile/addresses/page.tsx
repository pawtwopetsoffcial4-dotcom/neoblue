"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { MapPin, PlusCircle, Trash, Edit } from 'lucide-react';

type Address = {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  isDefault?: boolean;
};

type AddressResponse = {
  addresses?: Address[];
  defaultAddress?: Address | null;
  message?: string;
};

export default function AddressesPage() {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Address>({ street: '', city: '', state: '', zipcode: '', isDefault: false });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request<AddressResponse>('/profile/address');
      setAddresses(res.addresses || []);
      setDefaultAddress(res.defaultAddress || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!isAuthenticated) return;
    load();
  }, [isAuthenticated]);

  const handleChange = (k: keyof Address, v: any) => setForm((s) => ({ ...s, [k]: v }));
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editing && editing._id) {
        const res = await apiClient.request<AddressResponse>('/profile/address', {
          method: 'PUT',
          body: JSON.stringify({ ...form, id: editing._id }),
        });
        setAddresses(res.addresses || []);
        setDefaultAddress(res.defaultAddress || null);
        setEditing(null);
      } else {
        const res = await apiClient.request<AddressResponse>('/profile/address', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        setAddresses(res.addresses || []);
        setDefaultAddress(res.defaultAddress || null);
        setForm({ street: '', city: '', state: '', zipcode: '', isDefault: false });
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to save address');
    }
  };

  const startEdit = (a: Address) => {
    setEditing(a);
    setForm({ street: a.street, city: a.city, state: a.state, zipcode: a.zipcode, isDefault: !!a.isDefault });
  };

  const remove = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this address?')) return;
    try {
      const res = await apiClient.request<AddressResponse>(`/profile/address?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setAddresses(res.addresses || []);
      setDefaultAddress(res.defaultAddress || null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete address');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-black">Manage Addresses</h1>
          <p className="text-slate-600 mt-1">Add, edit or remove delivery addresses. Mark one as default for checkout.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-blue-100 p-6 shadow-sm">
            <h2 className="font-bold mb-4 flex items-center gap-2"><MapPin className="h-4 w-4"/> Saved Addresses</h2>
            {loading ? (
              <p>Loading…</p>
            ) : addresses.length === 0 ? (
              <p className="text-slate-500">No saved addresses yet.</p>
            ) : (
              <ul className="space-y-3">
                {addresses.map((a) => (
                  <li key={String(a._id)} className="p-3 rounded-lg border flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{a.street}</div>
                      <div className="text-xs text-slate-600">{a.city}, {a.state} - {a.zipcode}</div>
                      {a.isDefault && <div className="text-xs text-green-700 font-medium mt-1">Default</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(a)} className="h-8 w-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center"><Edit className="h-4 w-4"/></button>
                      <button onClick={() => remove(a._id)} className="h-8 w-8 rounded-md bg-red-50 text-red-600 flex items-center justify-center"><Trash className="h-4 w-4"/></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-blue-100 p-6 shadow-sm">
            <h2 className="font-bold mb-4 flex items-center gap-2"><PlusCircle className="h-4 w-4"/> {editing ? 'Edit Address' : 'Add Address'}</h2>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Street</label>
                <input value={form.street} onChange={(e) => handleChange('street', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-semibold">City</label>
                  <input value={form.city} onChange={(e) => handleChange('city', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                </div>
                <div className="w-36">
                  <label className="text-sm font-semibold">State</label>
                  <input value={form.state} onChange={(e) => handleChange('state', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Zipcode</label>
                <input value={form.zipcode} onChange={(e) => handleChange('zipcode', e.target.value)} className="mt-1 block w-40 rounded-md border px-3 py-2" />
              </div>
              <div className="flex items-center gap-3">
                <input id="isDefault" type="checkbox" checked={!!form.isDefault} onChange={(e) => handleChange('isDefault', e.target.checked)} />
                <label htmlFor="isDefault" className="text-sm">Set as default address</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="h-11 px-5 rounded-full bg-blue-600 text-white font-semibold">{editing ? 'Update' : 'Save'}</button>
                {editing && <button type="button" onClick={() => { setEditing(null); setForm({ street: '', city: '', state: '', zipcode: '', isDefault: false }); }} className="h-11 px-5 rounded-full border">Cancel</button>}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
