"use client";

import React from 'react';
import Link from 'next/link';
import { Home, Layers, ShoppingCart, User, Fish, Leaf } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMode } from '@/lib/hooks/useMode';

export default function MobileDock() {
  const pathname = usePathname();
  const { mode } = useMode();

  const isPlants = mode === 'plants';
  const activeBg = isPlants ? 'bg-green-50' : 'bg-blue-50';
  const activeText = isPlants ? 'text-green-700' : 'text-blue-600';

  const items = [
    { 
      href: '/', 
      label: 'Home', 
      icon: Home, 
      active: pathname === '/' 
    },
    { 
      href: '/categories', 
      label: 'Categories', 
      icon: Layers, 
      active: pathname.startsWith('/categories') 
    },
    { 
      href: '/products', 
      label: isPlants ? 'Plants' : 'Fishes', 
      icon: isPlants ? Leaf : Fish, 
      active: pathname.startsWith('/products') 
    },
    { 
      href: '/checkout', 
      label: 'Cart', 
      icon: ShoppingCart, 
      active: pathname.startsWith('/checkout') 
    },
    { 
      href: '/profile', 
      label: 'Account', 
      icon: User, 
      active: pathname.startsWith('/profile') 
    },
  ];

  return (
    <nav className="fixed bottom-4 inset-x-0 z-[1000] px-4 md:hidden">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-xl shadow-[0_12px_35px_rgba(0,0,0,0.1)] px-2 py-1.5">
        <ul className="grid grid-cols-5 gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center rounded-xl py-2 text-[11px] font-semibold transition-all duration-300 ${
                    item.active 
                      ? `${activeBg} ${activeText}` 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

