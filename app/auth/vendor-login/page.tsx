'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Store } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function VendorLoginPage() {
  const router = useRouter();
  const { login, user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'vendor') {
      router.replace('/vendor/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsLoading(true);
      const loggedInUser = await login(email, password);

      if (loggedInUser.role !== 'vendor') {
        throw new Error('This login is for vendors only.');
      }

      router.push('/vendor/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex items-center justify-center gap-2 mb-2 text-blue-700">
            <Store className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Vendor Portal</p>
          </div>
          <h1 className="text-3xl font-black text-center mb-2 text-slate-900">Vendor Login</h1>
          <p className="text-center text-slate-600 mb-8">Sign in to manage products and orders</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full px-4 py-3 rounded-lg border border-blue-200" type="email" placeholder="vendor@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="w-full px-4 py-3 rounded-lg border border-blue-200" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            <button type="submit" disabled={isLoading} className="w-full h-12 rounded-full bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing in...' : 'Vendor Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-blue-100 text-center text-sm text-slate-600">
            New vendor? <Link href="/auth/vendor-signup" className="text-blue-700 font-bold">Apply here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
