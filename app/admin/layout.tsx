"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ClipboardList, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: ClipboardList },
  { href: '/admin/blogs', label: 'Blogs', icon: BookOpen },
  { href: '/admin/vendors', label: 'Vendors', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <aside className="rounded-3xl bg-white border border-blue-100 p-4 md:p-5 h-fit shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">Admin Panel</p>
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
