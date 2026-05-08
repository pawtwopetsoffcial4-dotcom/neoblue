"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Fish, PlusCircle, PackageCheck, LogOut, Settings, ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const navItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Products', icon: Fish },
  { href: '/vendor/add-product', label: 'Add Product', icon: PlusCircle },
  { href: '/vendor/orders', label: 'Orders', icon: PackageCheck },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (user && user.role !== 'vendor') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user && user.role !== 'vendor')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-0">
      <div className="md:hidden bg-white border-b border-blue-100 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Vendor Panel</p>
            <h1 className="text-lg font-bold text-slate-900">Navigation</h1>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle vendor navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-slate-50 p-3 shadow-sm">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold text-sm flex-1 text-left">{item.label}</span>
                    {isActive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/auth/login');
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <aside className="hidden md:block rounded-3xl bg-white border border-blue-100 p-4 md:p-5 h-fit shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">Vendor Panel</p>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => {
              logout();
              router.push('/auth/login');
            }}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </aside>

        <section>{children}</section>
      </div>
    </div>
  );
}
