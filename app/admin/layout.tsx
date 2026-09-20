"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ClipboardList, LogOut, BookOpen, Menu, X, Package, FileText, Settings, ShoppingCart, UserCog, PackageCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, employeeAllowed: false },
  { href: '/admin/settings', label: 'Homepage & Carousel', icon: Settings, employeeAllowed: false },
  { href: '/admin/products', label: 'Products', icon: ClipboardList, employeeAllowed: false },
  { href: '/admin/combos', label: 'Combos', icon: Package, employeeAllowed: false },
  { href: '/admin/blogs', label: 'Blogs', icon: BookOpen, employeeAllowed: false },
  { href: '/admin/fish-descriptions', label: 'Descriptions', icon: FileText, employeeAllowed: false },
  { href: '/admin/vendors', label: 'Vendors & Shipping', icon: Users, employeeAllowed: true },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList, employeeAllowed: true },
  { href: '/admin/fulfillment', label: 'Packing & Dispatch', icon: PackageCheck, employeeAllowed: true },
  { href: '/admin/carts', label: 'Carts & Leads', icon: ShoppingCart, employeeAllowed: true },
  { href: '/admin/users', label: 'Users', icon: Users, employeeAllowed: false },
  { href: '/admin/employees', label: 'Employees', icon: UserCog, employeeAllowed: false },
];

const EMPLOYEE_DEFAULT_ROUTE = '/admin/orders';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isEmployee = user?.role === 'employee';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (user && !isAdmin && !isEmployee) {
      router.replace('/');
      return;
    }

    if (isEmployee) {
      const allowedPaths = navItems.filter((item) => item.employeeAllowed).map((item) => item.href);
      if (!allowedPaths.includes(pathname)) {
        router.replace(EMPLOYEE_DEFAULT_ROUTE);
      }
    }
  }, [isAuthenticated, user, isLoading, isAdmin, isEmployee, pathname, router]);

  if (isLoading || !isAuthenticated || (user && !isAdmin && !isEmployee)) {
    return null;
  }

  const visibleNavItems = isEmployee ? navItems.filter((item) => item.employeeAllowed) : navItems;
  const loginRoute = isEmployee ? '/employee/login' : '/auth/login';

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
            {visibleNavItems.map((item) => {
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
                router.push(loginRoute);
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 text-rose-600 font-semibold text-xs hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        )}
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden md:flex flex-col w-[250px] shrink-0 sticky top-20 lg:top-24 h-[calc(100vh-6.5rem)] rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm overflow-hidden z-20">
          <div className="px-2 pt-1 border-b border-slate-100 pb-3 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Control</p>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">Management</h2>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-1 pr-1 py-2 scrollbar-thin">
            {visibleNavItems.map((item) => {
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
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-slate-100 shrink-0">
            <button
              onClick={() => {
                logout();
                router.push(loginRoute);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-rose-600 font-semibold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
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
