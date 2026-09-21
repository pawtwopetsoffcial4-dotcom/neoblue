"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Eye, EyeOff, Pencil, Power, Trash2, X, UserPlus } from 'lucide-react';

type Employee = {
  _id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  const loadEmployees = async () => {
    try {
      const response = (await apiClient.getEmployees()) as { employees: Employee[] };
      setEmployees(response.employees ?? []);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsBusy(true);
      setMessage(null);
      await apiClient.createEmployee({ email: email.trim(), password: password || 'Employee@123' });
      setMessage('Employee assigned successfully');
      setEmail('');
      setPassword('');
      await loadEmployees();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add employee');
    } finally {
      setIsBusy(false);
    }
  };

  const toggleActive = async (employee: Employee) => {
    try {
      setIsBusy(true);
      setMessage(null);
      await apiClient.updateEmployee(employee._id, { isActive: !employee.isActive });
      await loadEmployees();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update employee status');
    } finally {
      setIsBusy(false);
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    const confirmed = window.confirm(`Remove employee access for "${employee.email}"?`);
    if (!confirmed) return;

    try {
      setIsBusy(true);
      setMessage(null);
      await apiClient.deleteEmployee(employee._id);
      await loadEmployees();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to remove employee');
    } finally {
      setIsBusy(false);
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditEmail(employee.email);
    setEditPassword('');
    setShowEditPassword(false);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      setIsBusy(true);
      setMessage(null);
      const payload: { email?: string; password?: string } = { email: editEmail.trim() };
      if (editPassword) payload.password = editPassword;
      await apiClient.updateEmployee(editingEmployee._id, payload);
      setMessage('Employee updated successfully');
      setEditingEmployee(null);
      await loadEmployees();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update employee');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Team &amp; Roles</p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Employees</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Assign team members for order tracking, fulfillment, and abandoned cart customer retention.
        </p>
      </div>

      <section className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <p className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-blue-600" />
          Assign Employee by Email
        </p>
        <p className="text-xs text-slate-500 mb-4">
          Enter any email address. If no password is provided, default password is <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">Employee@123</code>.
        </p>
        <form onSubmit={addEmployee} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <input
            type="email"
            placeholder="employee@neoblue.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
            required
          />
          <div className="relative flex-1 w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (optional, default: Employee@123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isBusy}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors shadow-xs disabled:opacity-60 cursor-pointer shrink-0"
          >
            {isBusy ? 'Assigning...' : 'Assign Employee'}
          </button>
        </form>
        {message && <p className="mt-3 text-xs font-bold text-blue-700 bg-blue-50 p-2.5 rounded-xl border border-blue-100">{message}</p>}
      </section>

      <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[580px]">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 sm:px-5 py-3.5 font-black uppercase tracking-wider text-[10px]">Email</th>
                <th className="text-left px-4 sm:px-5 py-3.5 font-black uppercase tracking-wider text-[10px]">Status</th>
                <th className="text-left px-4 sm:px-5 py-3.5 font-black uppercase tracking-wider text-[10px]">Added</th>
                <th className="text-right px-4 sm:px-5 py-3.5 font-black uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => (
                <tr key={employee._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 sm:px-5 py-4 font-bold text-slate-900 text-sm">{employee.email}</td>
                  <td className="px-4 sm:px-5 py-4">
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        employee.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {employee.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-4 text-slate-400 font-medium">{new Date(employee.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 sm:px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(employee)}
                        disabled={isBusy}
                        title="Edit"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(employee)}
                        disabled={isBusy}
                        title={employee.isActive ? 'Deactivate' : 'Activate'}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-60 cursor-pointer ${
                          employee.isActive
                            ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteEmployee(employee)}
                        disabled={isBusy}
                        title="Delete"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400 font-medium">
                    No employees added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="border-b border-slate-100 px-5 sm:px-6 py-4 flex items-center justify-between bg-slate-50/60">
              <div>
                <h2 className="text-sm font-black text-slate-900">Edit Employee</h2>
                <p className="text-[11px] text-slate-500">Update email or reset password</p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">New Password (optional)</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    {showEditPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="w-full sm:w-auto h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full sm:w-auto h-10 px-5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {isBusy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
