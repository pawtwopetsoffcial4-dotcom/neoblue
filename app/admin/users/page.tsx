"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'vendor' | 'admin';
  isApproved?: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [targetEmail, setTargetEmail] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  const promoteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;

    try {
      setIsBusy(true);
      setMessage(null);
      const response = (await apiClient.promoteUserToAdmin({ email: targetEmail.trim() })) as { message: string };
      setMessage(response.message || 'User promoted to admin');
      setTargetEmail('');
      await loadUsers();
    } catch (error: any) {
      setMessage(error.message || 'Failed to promote user');
    } finally {
      setIsBusy(false);
    }
  };

  const promoteFromRow = async (userId: string) => {
    try {
      setIsBusy(true);
      setMessage(null);
      const response = (await apiClient.promoteUserToAdmin({ userId })) as { message: string };
      setMessage(response.message || 'User promoted to admin');
      await loadUsers();
    } catch (error: any) {
      setMessage(error.message || 'Failed to promote user');
    } finally {
      setIsBusy(false);
    }
  };

  const removeAdmin = async (userId: string) => {
    const confirmed = window.confirm('Remove admin access from this user?');
    if (!confirmed) return;

    try {
      setIsBusy(true);
      setMessage(null);
      const response = (await apiClient.removeAdminRole({ userId })) as { message: string };
      setMessage(response.message || 'Admin access removed');
      await loadUsers();
    } catch (error: any) {
      setMessage(error.message || 'Failed to remove admin access');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Accounts</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">All Users</h1>
      </div>

      <section className="rounded-2xl bg-white border border-blue-100 p-5">
        <p className="font-bold text-slate-900 mb-3">Add Admin By Email</p>
        <form onSubmit={promoteByEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="user@example.com"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            className="flex-1 h-11 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isBusy}
            className="h-11 px-6 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {isBusy ? 'Updating...' : 'Make Admin'}
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-blue-700">{message}</p>}
      </section>

      <div className="rounded-2xl bg-white border border-blue-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-slate-600">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Vendor Status</th>
              <th className="text-left px-5 py-3">Joined</th>
              <th className="text-right px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-t border-blue-100">
                <td className="px-5 py-4 font-semibold text-slate-900">{user.name}</td>
                <td className="px-5 py-4 text-slate-600">{user.email}</td>
                <td className="px-5 py-4 text-slate-900 capitalize">{user.role}</td>
                <td className="px-5 py-4 text-slate-600">
                  {user.role === 'vendor' ? (user.isApproved ? 'Approved' : 'Pending') : '-'}
                </td>
                <td className="px-5 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-right">
                  {user.role !== 'admin' ? (
                    <button
                      onClick={() => promoteFromRow(user._id)}
                      disabled={isBusy}
                      className="h-9 px-4 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-colors disabled:opacity-60"
                    >
                      Make Admin
                    </button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs font-semibold text-emerald-700">Admin</span>
                      {currentUser?.id !== user._id && (
                        <button
                          onClick={() => removeAdmin(user._id)}
                          disabled={isBusy}
                          className="h-9 px-4 rounded-full border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors disabled:opacity-60"
                        >
                          Remove Admin
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
