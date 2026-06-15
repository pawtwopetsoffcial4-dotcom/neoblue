'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2, Store } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function VendorLoginPage() {
  const router = useRouter();
  const { login, loginWithSocial, logout, user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
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

  const handleSocialLogin = async (provider: any) => {
    if (!auth) {
      setError('Authentication is not configured. Please define NEXT_PUBLIC_FIREBASE_API_KEY in environment variables.');
      return;
    }
    setError(null);
    try {
      setIsSocialLoading(true);
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      if (firebaseUser.email) {
        const loggedInUser = await loginWithSocial(
          firebaseUser.displayName || 'Social Vendor',
          firebaseUser.email,
          firebaseUser.uid,
          'vendor'
        );

        if (loggedInUser.role !== 'vendor') {
          logout();
          throw new Error('This login is for vendors only.');
        }

        router.push('/vendor/dashboard');
      } else {
        throw new Error('Could not retrieve email address from social account.');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Social sign-in failed');
      }
    } finally {
      setIsSocialLoading(false);
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
            <div className="relative">
              <input
                className="w-full px-4 py-3 pr-12 rounded-lg border border-blue-200"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
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

            <button type="submit" disabled={isLoading} className="w-full h-12 rounded-full bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing in...' : 'Vendor Sign In'}
            </button>
          </form>

          {/* Social Logins */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              disabled={isLoading || isSocialLoading}
              onClick={() => handleSocialLogin(googleProvider)}
              className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-blue-100 text-center text-sm text-slate-600">
            New vendor? <Link href="/auth/vendor-signup" className="text-blue-700 font-bold">Apply here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
