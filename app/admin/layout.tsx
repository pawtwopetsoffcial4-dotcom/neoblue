"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, ClipboardList, LogOut, BookOpen, Menu, X, 
  Package, FileText, Settings, ShoppingCart, UserCog, PackageCheck, 
  ExternalLink, Sparkles, Truck, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  employeeAllowed: boolean;
  badge?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: 'Operations & Sales',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, employeeAllowed: false },
      { href: '/admin/orders', label: 'Orders', icon: ClipboardList, employeeAllowed: true },
      { href: '/admin/fulfillment', label: 'Packing & Dispatch', icon: PackageCheck, employeeAllowed: true },
      { href: '/admin/carts', label: 'Abandoned Carts', icon: ShoppingCart, employeeAllowed: true },
      { href: '/admin/vendors', label: 'Vendors & Shipping', icon: Truck, employeeAllowed: true },
    ]
  },
  {
    title: 'Catalog & Storefront',
    items: [
      { href: '/admin/products', label: 'Products Moderation', icon: Sparkles, employeeAllowed: false },
      { href: '/admin/combos', label: 'Combos & Packs', icon: Package, employeeAllowed: false },
      { href: '/admin/settings', label: 'Homepage & Carousel', icon: Settings, employeeAllowed: false },
      { href: '/admin/fish-descriptions', label: 'Preloaded Specs', icon: FileText, employeeAllowed: false },
      { href: '/admin/blogs', label: 'Blog Articles', icon: BookOpen, employeeAllowed: false },
    ]
  },
  {
    title: 'Access & Team',
    items: [
      { href: '/admin/users', label: 'User Directory', icon: Users, employeeAllowed: false },
      { href: '/admin/employees', label: 'Employee Roster', icon: UserCog, employeeAllowed: false },
    ]
  }
];

const allNavItems = navSections.flatMap(s => s.items);
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
      const allowedPaths = allNavItems.filter((item) => item.employeeAllowed).map((item) => item.href);
      if (!allowedPaths.includes(pathname)) {
        router.replace(EMPLOYEE_DEFAULT_ROUTE);
      }
    }
  }, [isAuthenticated, user, isLoading, isAdmin, isEmployee, pathname, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoading || !isAuthenticated || (user && !isAdmin && !isEmployee)) {
    return null;
  }

  const visibleSections = navSections.map(section => ({
    ...section,
    items: isEmployee ? section.items.filter(item => item.employeeAllowed) : section.items
  })).filter(section => section.items.length > 0);

  const activeItem = allNavItems.find(i => i.href === pathname);
  const loginRoute = isEmployee ? '/employee/login' : '/auth/login';

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col">
      {/* ── Top Global Admin Header Bar ── */}
      <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand + Portal Badge */}
          <div className="flex items-center gap-3">
            <Link href={isEmployee ? "/admin/orders" : "/admin/dashboard"} className="flex items-center gap-2.5 group">
              <div className="p-1 rounded-xl bg-blue-600/30 border border-blue-500/40 group-hover:bg-blue-600/50 transition-colors">
                <Image 
                  src="/logo.png" 
                  alt="NEOBLUE" 
                  width={28} 
                  height={28} 
                  className="h-6 w-auto object-contain"
                />
              </div>
              <span className="font-black text-sm tracking-[0.18em] uppercase text-white hidden sm:inline">
                NEOBLUE
              </span>
            </Link>

            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isEmployee 
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                : 'bg-blue-950/80 border-blue-500/40 text-blue-300'
            }`}>
              {isEmployee ? 'Staff Fulfillment' : 'Admin Portal'}
            </span>
          </div>

          {/* Active Breadcrumb (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Workspace</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-white font-bold">{activeItem?.label || 'Dashboard'}</span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Link to live store */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all shadow-2xs"
              title="Open customer live website in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">Live Store</span>
            </Link>

            {/* User Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
              <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center font-black text-[11px] text-white shrink-0">
                {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="text-left leading-tight hidden lg:block">
                <p className="font-bold text-white text-[11px] max-w-[120px] truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email}</p>
              </div>
            </div>

            {/* Desktop Logout Button */}
            <button
              onClick={() => {
                logout();
                router.push(loginRoute);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Sign out of management portal"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>

            {/* Mobile Hamburger Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-9 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white flex items-center gap-1.5 text-xs font-bold hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>
        </div>

        {/* ── Mobile Navigation Drawer ── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
            {visibleSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 py-1">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-blue-400" /> View Live Store
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push(loginRoute);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-rose-900/60 bg-rose-950/50 text-rose-300 font-bold text-xs hover:bg-rose-900/60 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Container Layout ── */}
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 flex flex-col md:flex-row gap-5 lg:gap-8 items-start flex-1 min-w-0">
        
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 sticky top-20 h-[calc(100vh-6.5rem)] rounded-2xl bg-white border border-slate-200/80 p-3 shadow-2xs overflow-hidden z-20">
          <nav className="flex-1 overflow-y-auto space-y-4 pr-1 py-1 custom-scrollbar">
            {visibleSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Bottom Footer */}
          <div className="pt-2 border-t border-slate-100 shrink-0 space-y-1">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                <span>Live Website</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">↗</span>
            </Link>
            <button
              onClick={() => {
                logout();
                router.push(loginRoute);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-700 font-bold text-xs hover:bg-rose-100/70 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <section className="min-w-0 flex-1 w-full max-w-full overflow-hidden">{children}</section>
      </div>
    </div>
  );
}
