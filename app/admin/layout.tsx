"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ClipboardList, LogOut, BookOpen, Menu, X, Package, FileText, Settings } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/settings', label: 'Homepage & Carousel', icon: Settings },
  { href: '/admin/products', label: 'Products', icon: ClipboardList },
  { href: '/admin/combos', label: 'Combos', icon: Package },
  { href: '/admin/blogs', label: 'Blogs', icon: BookOpen },
  { href: '/admin/fish-descriptions', label: 'Descriptions', icon: FileText },
  { href: '/admin/vendors', label: 'Vendors & Shipping', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !isAuthenticated || (user && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900">
      {/* Mobile Top Sub-Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin Control</p>
            <h1 className="text-base font-bold text-slate-900">Navigation</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <nav className="mt-3 space-y-1 border-t border-slate-100 pt-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                logout();
                router.push('/auth/login');
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 text-rose-600 font-semibold text-xs hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        )}
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 lg:gap-8">
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden md:block sticky top-24 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs self-start space-y-4">
          <div className="px-2 pt-1 border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Control</p>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">Management</h2>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                logout();
                router.push('/auth/login');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-rose-600 font-semibold text-xs hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
