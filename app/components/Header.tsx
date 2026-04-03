"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, ShoppingBag, Search, Waves } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';

type HeaderProps = {
  cartCount?: number;
};

export default function Header({ cartCount = 0 }: HeaderProps) {
  const { cartCount: contextCartCount } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const visibleCartCount = contextCartCount || cartCount;

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/categories', label: 'Categories' },
    { href: '/products', label: 'View Products' },
    { href: '/#trending', label: 'Trending' },
    ...(user?.role === 'admin' ? [{ href: '/admin/dashboard', label: 'Dashboard' }] : []),
    { href: '/profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-blue-600/95 backdrop-blur-2xl border-b border-blue-500">
      <nav className="w-full max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-white" />
            <span className="font-black text-xl tracking-tighter text-white">
              NEO<span className="text-blue-100 text-shadow-glow">BLUE</span>
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center space-x-8 text-sm font-medium tracking-widest uppercase text-blue-100">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="lg:hidden h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all border border-white/30"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link href="/products" className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all border border-white/30">
            <Search className="h-4 w-4" />
          </Link>
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="h-10 px-4 rounded-full border border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Logout
            </button>
          )}
          <Link href="/checkout" className="h-10 px-5 rounded-full bg-white text-blue-700 flex items-center gap-2 hover:bg-blue-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)]">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm font-bold">Cart ({visibleCartCount})</span>
          </Link>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="lg:hidden border-t border-white/15 bg-blue-700/95 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-blue-100">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 hover:bg-white/10 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}