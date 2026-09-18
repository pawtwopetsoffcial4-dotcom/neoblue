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
    if (!email.trim() || !password) return;

    try {
      setIsBusy(true);
      setMessage(null);
      await apiClient.createEmployee({ email: email.trim(), password });
      setMessage('Employee added successfully');
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
    const confirmed = window.confirm(`Delete employee "${employee.email}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsBusy(true);
      setMessage(null);
      await apiClient.deleteEmployee(employee._id);
      await loadEmployees();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete employee');
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
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Team</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Employees</h1>
      </div>

      <section className="rounded-2xl bg-white border border-blue-100 p-5">
        <p className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-blue-600" />
          Add Employee
        </p>
        <form onSubmit={addEmployee} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-11 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="relative flex-1">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 pr-10 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isBusy}
            className="h-11 px-6 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {isBusy ? 'Adding...' : 'Add Employee'}
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-blue-700">{message}</p>}
      </section>

      <div className="rounded-2xl bg-white border border-blue-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-slate-600">
            <tr>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Added</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee._id} className="border-t border-blue-100">
                <td className="px-5 py-4 font-semibold text-slate-900">{employee.email}</td>
                <td className="px-5 py-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      employee.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {employee.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500">{new Date(employee.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(employee)}
                      disabled={isBusy}
                      title="Edit"
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleActive(employee)}
                      disabled={isBusy}
                      title={employee.isActive ? 'Deactivate' : 'Activate'}
                      className={`h-9 w-9 flex items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
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
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  No employees added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50/60">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Edit Employee</h2>
                <p className="text-[11px] text-slate-500">Update email or reset password</p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">New Password (optional)</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="h-9 px-5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
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
