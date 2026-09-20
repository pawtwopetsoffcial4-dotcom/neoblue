"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { Users, UserCog, ShieldCheck, UserCheck, RefreshCw, UserMinus, Search } from 'lucide-react';

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'vendor' | 'admin' | 'employee';
  isApproved?: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState<'employee' | 'admin' | 'user'>('employee');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadUsers = async () => {
    try {
      const response = (await apiClient.getAdminUsers()) as { users: AdminUser[] };
      setUsers(response.users ?? []);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSetRoleByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;

    try {
      setIsBusy(true);
      setMessage(null);
      const action = targetRole === 'admin' ? 'promote' : targetRole === 'employee' ? 'make_employee' : 'demote';
      const response = (await apiClient.promoteUserToAdmin({ email: targetEmail.trim(), action })) as { message: string };
      setMessage({ text: response.message || `User assigned as ${targetRole}`, type: 'success' });
      setTargetEmail('');
      await loadUsers();
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to update user role', type: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: 'admin' | 'employee' | 'user') => {
    try {
      setIsBusy(true);
      setMessage(null);
      const action = role === 'admin' ? 'promote' : role === 'employee' ? 'make_employee' : 'demote';
      const response = (await apiClient.promoteUserToAdmin({ userId, action })) as { message: string };
      setMessage({ text: response.message || 'User role updated successfully', type: 'success' });
      await loadUsers();
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to update role', type: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Accounts &amp; Access</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">User Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage store accounts, assign employees for order tracking &amp; cart recovery, and grant admin roles.
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Set Role by Email Card */}
      <section className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <h2 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
          <UserCog className="h-4 w-4 text-blue-600" />
          Assign Role to Any Email
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Enter any existing user email or new address to grant Employee or Admin access.
        </p>

        <form onSubmit={handleSetRoleByEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="e.g. employee@neoblue.in or customer@gmail.com"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
            required
          />
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as any)}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
          >
            <option value="employee">Role: Employee (Orders &amp; Carts)</option>
            <option value="admin">Role: Admin (Full Access)</option>
            <option value="user">Role: Customer (Standard)</option>
          </select>
          <button
            type="submit"
            disabled={isBusy}
            className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors shadow-xs disabled:opacity-60 cursor-pointer shrink-0"
          >
            {isBusy ? 'Assigning...' : 'Assign Role'}
          </button>
        </form>

        {message && (
          <p className={`mt-3 text-xs font-bold ${message.type === 'success' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'} p-2.5 rounded-xl border ${message.type === 'success' ? 'border-emerald-100' : 'border-rose-100'}`}>
            {message.text}
          </p>
        )}
      </section>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3.5 font-black uppercase tracking-wider text-[10px]">Name &amp; Email</th>
                <th className="text-left px-5 py-3.5 font-black uppercase tracking-wider text-[10px]">Role</th>
                <th className="text-left px-5 py-3.5 font-black uppercase tracking-wider text-[10px]">Vendor Status</th>
                <th className="text-left px-5 py-3.5 font-black uppercase tracking-wider text-[10px]">Joined</th>
                <th className="text-right px-5 py-3.5 font-black uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                    <p className="text-slate-400 text-xs font-mono">{u.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : u.role === 'employee' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <UserCheck className="w-3 h-3" /> Employee
                      </span>
                    ) : u.role === 'vendor' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Vendor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Customer
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">
                    {u.role === 'vendor' ? (u.isApproved ? 'Approved' : 'Pending') : '—'}
                  </td>
                  <td className="px-5 py-4 text-slate-400 font-medium">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {u.role !== 'employee' && (
                        <button
                          onClick={() => handleUpdateRole(u._id, 'employee')}
                          disabled={isBusy}
                          className="h-8 px-3 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          Make Employee
                        </button>
                      )}

                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleUpdateRole(u._id, 'admin')}
                          disabled={isBusy}
                          className="h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          Make Admin
                        </button>
                      )}

                      {u.role !== 'user' && currentUser?.id !== u._id && (
                        <button
                          onClick={() => handleUpdateRole(u._id, 'user')}
                          disabled={isBusy}
                          className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold text-[11px] transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          Revert to User
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-medium">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

