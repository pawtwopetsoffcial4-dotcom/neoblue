'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, AlertCircle, Search } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type FishDescription = {
  _id: string;
  name: string;
  description: string;
};

export default function AdminFishDescriptionsPage() {
  const [descriptions, setDescriptions] = useState<FishDescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDescriptions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.request('/admin/fish-descriptions') as any;
      if (res.descriptions) {
        setDescriptions(res.descriptions);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDescriptions();
  }, []);

  const handleOpenModal = (desc?: FishDescription) => {
    setError('');
    if (desc) {
      setEditingId(desc._id);
      setFormData({ name: desc.name, description: desc.description });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      setError('Name and description are required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (editingId) {
        await apiClient.request(`/admin/fish-descriptions/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiClient.request('/admin/fish-descriptions', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      await fetchDescriptions();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save description.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the description for "${name}"?`)) return;
    
    try {
      await apiClient.request(`/admin/fish-descriptions/${id}`, {
        method: 'DELETE',
      });
      setDescriptions(prev => prev.filter(d => d._id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete description.');
    }
  };

  const filteredDescriptions = descriptions.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Preloaded Descriptions</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage preloaded product descriptions for vendors.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Description
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:font-normal"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 mb-4" />
            <p className="text-slate-500 font-medium text-sm">Loading descriptions...</p>
          </div>
        ) : filteredDescriptions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 font-medium">No descriptions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[540px]">
              <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Description Snippet</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDescriptions.map((desc) => (
                  <tr key={desc._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{desc.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium max-w-md truncate">
                      {desc.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(desc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(desc._id, desc.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl my-auto animate-fade-in-up">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {editingId ? 'Edit Description' : 'Add New Description'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Red AFs"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Preloaded Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter the comprehensive HTML description..."
                  rows={10}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-y font-mono"
                />
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  You can use HTML tags like &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;h3&gt; for formatting.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
              <button
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Description'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
