"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, X, ShoppingBag, Search } from 'lucide-react';
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
    { href: '/products', label: 'View Products' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/return-refund-policy', label: 'Return & Refund' },
    { href: '/#trending', label: 'Trending' },
    ...(user ? [{ href: '/profile', label: 'Profile' }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin/dashboard', label: 'Dashboard' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-blue-600/95 backdrop-blur-md border-b border-blue-500 shadow-sm">
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
          
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:flex h-9.5 px-4 rounded-full border border-white/20 text-blue-50 text-sm font-medium items-center justify-center hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          )}

          <Link href="/checkout" className="h-9.5 px-4 rounded-full bg-white text-blue-600 flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-sm">
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

      {isMenuOpen && (
        <div className="lg:hidden border-t border-blue-500 bg-blue-700/95 backdrop-blur-md absolute w-full left-0 shadow-lg top-full">
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
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-4 py-3 text-left hover:bg-white/10 hover:text-white transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div className="border-t border-blue-500 bg-blue-700/95 backdrop-blur-md px-4 py-4">
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
              className="px-6 py-2 rounded-full bg-white text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
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