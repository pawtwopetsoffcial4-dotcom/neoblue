"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, X, ShoppingBag, Search, Fish, Leaf } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMode } from '@/lib/hooks/useMode';

type HeaderProps = {
  cartCount?: number;
};

export default function Header({ cartCount = 0 }: HeaderProps) {
  const { cartCount: contextCartCount } = useCart();
  const { user, logout } = useAuth();
  const { mode, setMode } = useMode();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const visibleCartCount = contextCartCount || cartCount;

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/categories', label: 'Categories' },
    { href: '/products', label: 'Products' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/return-refund-policy', label: 'Return & Refund' },
    { href: '/#trending', label: 'Trending' },
    ...(user ? [{ href: '/profile', label: 'Profile' }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin/dashboard', label: 'Dashboard' }] : []),
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-500 ${
      mode === 'fishes' ? 'bg-blue-600/95 border-blue-500' : 'bg-green-700/95 border-green-600'
    }`}>
      <nav className="w-full max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <Image 
              src="/logo.png" 
              alt="NEOBLUE Logo" 
              width={40} 
              height={40} 
              className="h-9 w-auto object-contain hover:opacity-90 transition-opacity"
              priority
            />
            <span className="font-extrabold text-xl tracking-widest text-white uppercase ml-1">
              NEOBLUE
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex flex-1 items-center justify-center space-x-8 text-sm font-medium text-blue-100">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 flex-none">
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="h-9.5 w-9.5 rounded-full text-blue-100 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </button>
          
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:flex h-9.5 px-4 rounded-full border border-white/20 text-blue-50 text-sm font-medium items-center justify-center hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="hidden md:flex h-9.5 px-4 rounded-full border border-white/20 text-blue-50 text-sm font-medium items-center justify-center hover:bg-white/10 transition-colors"
            >
              Login
            </Link>
          )}

          <Link 
            href="/checkout" 
            className={`h-9.5 px-4 rounded-full bg-white flex items-center gap-2 hover:opacity-90 transition-all shadow-sm ${
              mode === 'fishes' ? 'text-blue-600' : 'text-green-700'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm font-bold">{visibleCartCount}</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="lg:hidden h-9.5 w-9.5 rounded-full text-blue-100 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Global Mode Switcher — Premium Segmented Pill */}
      <div className="w-full border-t border-white/10 py-2.5 px-4 flex items-center justify-center bg-black/10 backdrop-blur-sm">
        <div className={`relative flex items-center p-1 rounded-2xl shadow-inner transition-all duration-500 ${
          mode === 'fishes'
            ? 'bg-blue-900/40 ring-1 ring-blue-400/20'
            : 'bg-green-900/40 ring-1 ring-green-400/20'
        }`}>

          {/* Sliding active indicator */}
          <span
            aria-hidden="true"
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl shadow-lg transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              mode === 'fishes'
                ? 'left-1 bg-white/95 shadow-blue-500/30'
                : 'left-[calc(50%+3px)] bg-white/95 shadow-green-500/30'
            }`}
          />

          {/* NEOBLUE (Fishes) tab */}
          <button
            onClick={() => { setMode('fishes'); router.push('/'); }}
            className={`relative z-10 flex items-center gap-2 px-5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all duration-300 select-none ${
              mode === 'fishes'
                ? 'text-blue-600'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Fish className={`h-3.5 w-3.5 transition-all duration-300 ${mode === 'fishes' ? 'scale-110' : ''}`} />
            <span>NeoBlue</span>
          </button>

          {/* NEOBLUE PLANTS tab */}
          <button
            onClick={() => { setMode('plants'); router.push('/'); }}
            className={`relative z-10 flex items-center gap-2 px-5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all duration-300 select-none ${
              mode === 'plants'
                ? 'text-green-700'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Leaf className={`h-3.5 w-3.5 transition-all duration-300 ${mode === 'plants' ? 'scale-110' : ''}`} />
            <span>Plants</span>
          </button>
        </div>

        {/* Active mode subtle glow label */}
        <span className={`ml-3 text-[10px] font-semibold uppercase tracking-widest transition-all duration-500 hidden sm:block ${
          mode === 'fishes' ? 'text-blue-200/60' : 'text-green-200/60'
        }`}>
          {mode === 'fishes' ? 'Aquarium & Live Stock' : 'Aquatic Plants & Flora'}
        </span>
      </div>

      {isMenuOpen && (
        <div className={`lg:hidden border-t absolute w-full left-0 shadow-lg top-full backdrop-blur-md transition-colors duration-500 ${
          mode === 'fishes' ? 'border-blue-500 bg-blue-700/95' : 'border-green-600 bg-green-800/95'
        }`}>
          <div className="px-4 py-4 flex flex-col gap-1 text-sm font-medium text-blue-50">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-lg px-4 py-3 hover:bg-white/10 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-4 py-3 text-left hover:bg-white/10 hover:text-white transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/auth/login"
                onClick={closeMenu}
                className="rounded-lg px-4 py-3 text-left hover:bg-white/10 hover:text-white transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div className={`border-t backdrop-blur-md px-4 py-4 transition-colors duration-500 ${
          mode === 'fishes' ? 'border-blue-500 bg-blue-700/95' : 'border-green-600 bg-green-800/95'
        }`}>
          <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-4 py-2 rounded-full text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <button
              type="submit"
              className={`px-6 py-2 rounded-full bg-white font-medium text-sm hover:opacity-90 transition-opacity ${
                mode === 'fishes' ? 'text-blue-600' : 'text-green-700'
              }`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="px-4 py-2 rounded-full text-blue-100 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </header>
  );
}