'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2, Store } from 'lucide-react';

export default function VendorSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [logo, setLogo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/vendor/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          city,
            state: stateName,
          pincode,
            logo,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Vendor signup failed');
      }

      setSuccess('Registration submitted. Please wait for admin approval, then login.');
      setTimeout(() => router.push('/auth/vendor-login'), 1400);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex items-center justify-center gap-2 mb-2 text-blue-700">
            <Store className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Vendor Portal</p>
          </div>
          <h1 className="text-3xl font-black text-center mb-2 text-slate-900">Vendor Signup</h1>
          <p className="text-center text-slate-600 mb-8">Create seller account for approval</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Business or Owner Name</label>
              <input
                className="w-full h-12 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Aqua Marine Traders"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Business Email</label>
              <input
                className="w-full h-12 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Logo URL (optional)</label>
                <input
                  className="w-full h-12 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                />
              </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                className="w-full h-12 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <input
                className="w-full h-12 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Shop No, Street, Area"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                <input
                  className="w-full h-12 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                <input
                  className="w-full h-12 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Maharashtra"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                <input
                  className="w-full h-12 px-4 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="400001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  className="w-full h-12 px-4 pr-12 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  className="w-full h-12 px-4 pr-12 rounded-xl border border-blue-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-700"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-12 rounded-full bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-blue-100 text-center text-sm text-slate-600">
            Already approved? <Link href="/auth/vendor-login" className="text-blue-700 font-bold">Vendor Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
