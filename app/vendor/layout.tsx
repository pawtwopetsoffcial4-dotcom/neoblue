"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Fish, PlusCircle, PackageCheck, LogOut, Settings, ChevronDown, ChevronUp, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const navItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Products', icon: Fish },
  { href: '/vendor/add-product', label: 'Add Product', icon: PlusCircle },
  { href: '/vendor/orders', label: 'Orders', icon: PackageCheck },
  { href: '/vendor/claims', label: 'DOA Claims', icon: Shield },
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
    <div className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/90 backdrop-blur-xl md:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-neoblue-linear-to-r px-4 py-4 text-white shadow-lg">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-blue-100">Vendor Panel</p>
              <h1 className="mt-1 text-lg font-black tracking-tight">NeoBlue Studio</h1>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle vendor navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mt-4 rounded-3xl border border-blue-100 bg-white p-3 shadow-sm">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
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
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 px-4 py-3 font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8 lg:pt-6">
        <aside className="hidden rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm lg:block lg:h-fit lg:sticky lg:top-6">
          <div className="rounded-3xl bg-neoblue-linear-to-br p-5 text-white shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-blue-100">Vendor Panel</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">NeoBlue Studio</h2>
            <p className="mt-2 text-sm leading-6 text-blue-50/90">Manage products, orders, and shipping from one clean workspace.</p>
          </div>

          <nav className="mt-5 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                    isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-700 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => {
              logout();
              router.push('/auth/login');
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 px-4 py-3 font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
