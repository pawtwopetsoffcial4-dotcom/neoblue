"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Menu, X, ShoppingBag, Search, Fish, Leaf, User, LogOut, 
  LayoutDashboard, ClipboardList, ChevronDown, Home, BookOpen, 
  FolderHeart, Info, LogIn, Bell, Settings, Heart
} from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMode } from '@/lib/hooks/useMode';
import { useNotifications } from '@/lib/hooks/useNotifications';
import NotificationBell from './NotificationBell';

type HeaderProps = {
  cartCount?: number;
};

export default function Header({ cartCount = 0 }: HeaderProps) {
  const { cartCount: contextCartCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const { mode, setMode } = useMode();
  const router = useRouter();
  const pathname = usePathname();
  const isFishes = mode === 'fishes';
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount: unreadNotifications } = useNotifications();
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const visibleCartCount = contextCartCount || cartCount;

  const [headerPhraseIndex, setHeaderPhraseIndex] = useState(0);
  const headerPhrases = useMemo(() => {
    return isFishes
      ? ['Halfmoon Betta', 'Neon Tetra', 'Red Cherry Shrimp', 'Guppy Pairs', 'Discus & Angelfish']
      : ['Anubias Nana', 'Java Fern', 'Low Light Plants', 'Aquarium Moss', 'Carpet Flora'];
  }, [isFishes]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderPhraseIndex((prev) => (prev + 1) % headerPhrases.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [headerPhrases.length]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu and dropdowns when navigating
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const handleLogoClick = () => {
    fetch('/api/notifications/test', { method: 'POST' }).catch(() => {});
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Primary navigation links for desktop
  const desktopLinks = [
    { href: '/', label: 'Home' },
    { href: '/categories', label: 'Categories' },
    { href: '/products', label: 'Products' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About Us' },
  ];

  // Detailed mobile navigation items with icons
  const mobileLinks = [
    { href: '/', label: 'Home', icon: Home, color: 'text-white' },
    { href: '/categories', label: 'Categories', icon: FolderHeart, color: 'text-white' },
    { href: '/products', label: 'Products', icon: ShoppingBag, color: 'text-white' },
    { href: '/blog', label: 'Blog', icon: BookOpen, color: 'text-white' },
    { href: '/about', label: 'About Us', icon: Info, color: 'text-white' },
    ...(user ? [
      { href: '/orders', label: 'My Orders', icon: ClipboardList, color: 'text-white' },
    ] : []),
  ];

  // Helper to extract user name initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Outer header theme matches user requested colors: blue for neoblue, green for plants
  const headerBgClass = isFishes ? 'bg-blue-600 border-blue-500' : 'bg-green-700 border-green-600';
  const headerTextMuted = isFishes ? 'text-blue-100' : 'text-green-100';

  return (
    <header className={`sticky top-0 z-50 border-b shadow-md transition-colors duration-500 ${headerBgClass}`}>
      <nav className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-1.5 sm:gap-2 group">
            <div className="p-0.5 rounded-lg bg-white/10 border border-white/10 group-hover:bg-white/15 transition-all">
              <Image
                src="/logo.png"
                alt="NEOBLUE Logo"
                width={36} 
                height={36} 
                className="h-7 w-auto sm:h-8 sm:w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </div>
            <span className="font-black text-sm sm:text-lg tracking-[0.12em] sm:tracking-[0.2em] text-white uppercase ml-0.5 sm:ml-1 shrink-0">
              NEOBLUE
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className={`hidden lg:flex items-center justify-center space-x-7 text-xs font-black uppercase tracking-wider ${headerTextMuted}`}>
          {desktopLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`relative py-1 transition-all duration-300 ${
                  isActive 
                    ? 'text-white font-extrabold'
                    : 'hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-3 flex-none">
          
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl text-white flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 transition-all duration-300 ${
              isSearchOpen ? 'ring-2 ring-white/30' : ''
            }`}
            aria-label="Search products"
          >
            <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </button>


          {/* Wishlist Button */}
          <Link
            href="/wishlist"
            className="relative h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-all duration-300 shadow-xs cursor-pointer"
            aria-label="View Wishlist"
          >
            <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${wishlistCount > 0 ? 'text-rose-400 fill-rose-400' : 'text-white'}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Shopping Bag / Cart */}
          <button 
            type="button"
            onClick={openCart}
            className={`h-8.5 px-2.5 sm:h-9 sm:px-4 rounded-xl flex items-center gap-1.5 sm:gap-2 font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer ${
              isFishes 
                ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-900/20' 
                : 'bg-green-800 hover:bg-green-900 text-white shadow-green-900/20'
            }`}
            aria-label="Open Shopping Cart"
          >
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{visibleCartCount}</span>
          </button>

          {/* Notification Bell (Desktop) */}
          {user && (
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          )}

          {/* User Account / Profile Dropdown (Desktop) */}
          <div className="relative hidden md:block" ref={profileDropdownRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`h-9 flex items-center gap-2 pl-2 pr-3 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/15 transition-all duration-300 ${
                  isProfileOpen ? 'ring-2 ring-white/30' : ''
                }`}
              >
                <div className="relative">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${
                    isFishes ? 'bg-blue-700' : 'bg-green-800'
                  }`}>
                    {getInitials(user.name)}
                  </div>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-rose-500 ring-1 ring-blue-600 animate-pulse" />
                  )}
                </div>
                <span className="text-xs font-bold truncate max-w-[80px]">{user.name.split(' ')[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/75 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="h-9 px-4 rounded-xl border border-white/10 bg-white/5 text-white/90 text-xs font-black uppercase tracking-wider inline-flex items-center justify-center hover:bg-white/15 hover:text-white transition-all duration-300"
              >
                Login
              </Link>
            )}

            {/* Profile Dropdown Menu */}
            {user && (
              <div className={`absolute right-0 mt-2.5 w-60 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-3 shadow-2xl z-50 text-slate-100 flex flex-col gap-1 transition-all duration-300 ${
                isProfileOpen
                  ? 'opacity-100 translate-y-0 pointer-events-auto visible scale-100'
                  : 'opacity-0 -translate-y-3 pointer-events-none invisible scale-95'
              }`}>
                <div className="px-3 py-2 border-b border-white/5 mb-1 text-left">
                  <p className="font-extrabold text-sm truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                  <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    user.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    user.role === 'vendor' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {user.role}
                  </span>
                </div>

                <Link
                  href="/profile?tab=notifications"
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span>Notifications</span>
                  </div>
                  {unreadNotifications > 0 && (
                    <span className="bg-rose-500 text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full animate-pulse">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Profile Settings
                </Link>

                <Link
                  href="/orders"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  My Orders
                </Link>

                {user.role === 'admin' && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                    >
                      <LayoutDashboard className="w-4 h-4 text-red-400" />
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-blue-400 hover:bg-white/5 hover:text-white transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-blue-400" />
                      Homepage & Carousel
                    </Link>
                  </>
                )}

                {user.role === 'vendor' && (
                  <Link
                    href="/vendor/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                  >
                    <LayoutDashboard className="w-4 h-4 text-purple-400" />
                    Vendor Dashboard
                  </Link>
                )}

                <div className="border-t border-white/5 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="lg:hidden h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl text-white flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 transition-colors"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </nav>

      {/* Global Mode Switcher — Premium Segmented Pill */}
      <div className="w-full border-t border-white/10 py-2.5 px-4 flex items-center justify-center bg-black/10 backdrop-blur-sm">
        <div className={`relative flex items-center p-1 rounded-2xl shadow-inner transition-all duration-500 ${
          isFishes
            ? 'bg-blue-900/40 ring-1 ring-blue-400/20'
            : 'bg-green-900/40 ring-1 ring-green-400/20'
        }`}>

          {/* Sliding active indicator */}
          <span
            aria-hidden="true"
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl shadow-lg transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isFishes
                ? 'left-1 bg-white/95 shadow-blue-500/30'
                : 'left-[calc(50%+3px)] bg-white/95 shadow-green-500/30'
            }`}
          />

          {/* NEOBLUE (Fishes) tab */}
          <button
            onClick={() => { setMode('fishes'); router.push('/'); }}
            className={`relative z-10 flex items-center gap-2 px-5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all duration-300 select-none ${
              isFishes
                ? 'text-blue-600'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Fish className={`h-3.5 w-3.5 transition-all duration-300 ${isFishes ? 'scale-110' : ''}`} />
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
          isFishes ? 'text-blue-200/60' : 'text-green-200/60'
        }`}>
          {isFishes ? 'Aquarium & Live Stock' : 'Aquatic Plants & Flora'}
        </span>
      </div>

      {/* Mobile Drawer-Style Overlay Menu */}
      <div className={`absolute w-full left-0 top-full border-t shadow-2xl p-5 flex flex-col gap-6 text-sm font-medium z-50 max-h-[85vh] overflow-y-auto transition-all duration-300 ${
        isMenuOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto visible'
          : 'opacity-0 -translate-y-4 pointer-events-none invisible'
      } ${
        isFishes ? 'border-blue-500 bg-blue-600/95' : 'border-green-600 bg-green-700/95'
      }`}>
          
          {/* Main Navigation Links */}
          <div className="grid grid-cols-2 gap-3.5">
            {mobileLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-all duration-200"
                >
                  <Icon className="w-4 h-4 text-white" />
                  <span className="font-bold text-xs">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Account Details Panel (Bottom Section) */}
          <div className="border-t border-white/10 pt-5 flex flex-col gap-4 text-left">
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-2 bg-white/10 rounded-2xl border border-white/10">
                  <div className="relative shrink-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white ${
                      isFishes ? 'bg-blue-700' : 'bg-green-800'
                    }`}>
                      {getInitials(user.name)}
                    </div>
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-blue-600 animate-pulse" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-extrabold text-xs text-white leading-tight">{user.name}</p>
                    <p className="text-[10px] text-white/70 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href="/profile?tab=notifications"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-wider border border-white/10 hover:bg-white/15 relative"
                  >
                    <Bell className="w-4 h-4 text-white" />
                    <span>Notifications</span>
                    {unreadNotifications > 0 && (
                      <span className="absolute right-3 bg-rose-500 text-[9px] font-black text-white px-2 py-0.5 rounded-full animate-pulse">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-wider border border-white/10 hover:bg-white/15"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>

                  {user.role === 'admin' && (
                    <>
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-950/20 text-red-300 text-xs font-black uppercase tracking-wider border border-red-500/20 hover:bg-red-500/30"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                      <Link
                        href="/admin/settings"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950/20 text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-500/20 hover:bg-blue-500/30"
                      >
                        <Settings className="w-4 h-4" />
                        Homepage & Carousel
                      </Link>
                    </>
                  )}

                  {user.role === 'vendor' && (
                    <Link
                      href="/vendor/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-950/20 text-purple-300 text-xs font-black uppercase tracking-wider border border-purple-500/20 hover:bg-purple-500/30"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Vendor Dashboard
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-950/20 text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-500/20 hover:bg-rose-500/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setIsMenuOpen(false)}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-colors ${
                  isFishes 
                    ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-900/20' 
                    : 'bg-green-800 hover:bg-green-900 text-white shadow-green-900/20'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Login to Account
              </Link>
            )}
          </div>
        </div>

      {/* Floating Search Form Panel */}
      <div className={`border-t border-white/10 px-4 py-3.5 shadow-2xl transition-all duration-300 absolute w-full left-0 top-full z-40 ${
        isSearchOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto visible'
          : 'opacity-0 -translate-y-3 pointer-events-none invisible'
      } ${headerBgClass}`}>
          <form onSubmit={handleSearchSubmit} className="max-w-4xl mx-auto flex gap-2">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=""
                className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white text-xs outline-none focus:ring-2 focus:ring-white/30"
                autoFocus
              />
              {!searchQuery && (
                <div className="absolute left-4 right-4 top-0 bottom-0 flex items-center pointer-events-none overflow-hidden select-none">
                  <div key={headerPhraseIndex} className="animate-text-slide flex items-center gap-1 text-xs text-white/60">
                    <span>Search</span>
                    <span className="font-bold text-white/95">&ldquo;{headerPhrases[headerPhraseIndex]}&rdquo;</span>
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              className={`px-5 rounded-xl font-black text-xs uppercase tracking-wider text-white transition-colors flex items-center gap-1.5 ${
                isFishes ? 'bg-blue-700 hover:bg-blue-800' : 'bg-green-800 hover:bg-green-900'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              <span>Search</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="px-4 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
    </header>
  );
}