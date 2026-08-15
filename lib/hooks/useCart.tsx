'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useAuth } from './useAuth';
import { useMode } from './useMode';

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  perPairPrice?: number | null;
  unitLabel?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: MarketplaceProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  loadSharedCart: (sharedItems: CartItem[], action: 'merge' | 'replace') => void;
  cartCount: number;
  totalAmount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState<{ id: number; title: string; image?: string; price: number; unitLabel?: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { mode } = useMode();
  const isPlants = mode === 'plants';
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Load/merge carts on user change
  useEffect(() => {
    const loadCart = async () => {
      setIsLoaded(false);
      const rawGuestCart = localStorage.getItem('neoblue-cart-guest');
      let guestItems: CartItem[] = [];
      if (rawGuestCart) {
        try {
          guestItems = JSON.parse(rawGuestCart);
        } catch {}
      }

      if (user) {
        try {
          const token = localStorage.getItem('authToken') || '';
          const response = await fetch('/api/cart', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const dbItems: CartItem[] = data.items || [];

            if (guestItems.length > 0) {
              const merged = [...dbItems];
              guestItems.forEach((gItem) => {
                const existing = merged.find((uItem) => uItem.productId === gItem.productId);
                if (existing) {
                  existing.quantity += gItem.quantity;
                } else {
                  merged.push(gItem);
                }
              });

              const saveResponse = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  items: merged.map((item) => ({ productId: item.productId, quantity: item.quantity })),
                }),
              });

              if (saveResponse.ok) {
                const saveData = await saveResponse.json();
                setItems(saveData.items || merged);
              } else {
                setItems(merged);
              }
              localStorage.removeItem('neoblue-cart-guest');
            } else {
              setItems(dbItems);
            }
          } else {
            const rawUserCart = localStorage.getItem(`neoblue-cart-${user.id}`);
            let userItems: CartItem[] = [];
            if (rawUserCart) {
              try {
                userItems = JSON.parse(rawUserCart);
              } catch {}
            }
            setItems(userItems);
          }
        } catch (err) {
          console.error('Failed to load cart from DB, falling back to localStorage:', err);
          const rawUserCart = localStorage.getItem(`neoblue-cart-${user.id}`);
          let userItems: CartItem[] = [];
          if (rawUserCart) {
            try {
              userItems = JSON.parse(rawUserCart);
            } catch {}
          }
          setItems(userItems);
        }
      } else {
        setItems(guestItems);
      }
      setIsLoaded(true);
    };

    loadCart();
  }, [user]);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    const key = user ? `neoblue-cart-${user.id}` : 'neoblue-cart-guest';
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, user, isLoaded]);

  // Helper to sync cart changes with database
  const syncCartToDB = (currentItems: CartItem[]) => {
    if (!user) return;
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('authToken') || '';
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            items: currentItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });
      } catch (err) {
        console.error('Failed to sync cart to database:', err);
      }
    }, 500);
  };

  const addToCart = (product: MarketplaceProduct) => {
    const existingIndex = items.findIndex((item) => item.productId === product._id);
    let newItems: CartItem[] = [];
    const isPair = (product as any).perPairPrice != null;
    const unitLabel = isPair ? 'pair' : 'piece';

    if (existingIndex > -1) {
      newItems = [...items];
      newItems[existingIndex].quantity += 1;
      if (!newItems[existingIndex].unitLabel) {
        newItems[existingIndex].unitLabel = unitLabel;
      }
    } else {
      newItems = [
        ...items,
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] ?? '/api/placeholder/400/300',
          quantity: 1,
          perPairPrice: (product as any).perPairPrice ?? null,
          unitLabel,
        },
      ];
    }
    setItems(newItems);
    syncCartToDB(newItems);

    // Show toast notification
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({
      id: Date.now(),
      title: product.title,
      image: product.images?.[0],
      price: product.price,
      unitLabel,
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const removeFromCart = (productId: string) => {
    const newItems = items.filter((item) => item.productId !== productId);
    setItems(newItems);
    syncCartToDB(newItems);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newItems = items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setItems(newItems);
    syncCartToDB(newItems);
  };

  const clearCart = () => {
    setItems([]);
    syncCartToDB([]);
  };

  const loadSharedCart = (sharedItems: CartItem[], action: 'merge' | 'replace') => {
    let newItems: CartItem[] = [];
    if (action === 'replace') {
      newItems = sharedItems;
    } else {
      const merged = [...items];
      sharedItems.forEach((sItem) => {
        const existing = merged.find((m) => m.productId === sItem.productId);
        if (existing) {
          existing.quantity += sItem.quantity;
        } else {
          merged.push(sItem);
        }
      });
      newItems = merged;
    }
    setItems(newItems);
    syncCartToDB(newItems);
  };

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadSharedCart,
        cartCount,
        totalAmount,
      }}
    >
      {children}

      {/* Modern Storefront-Matching Toast Notification */}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl p-3.5 shadow-2xl shadow-slate-900/15 border border-slate-200/90 flex items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-center gap-3 min-w-0">
            {toast.image ? (
              <img
                src={toast.image}
                alt={toast.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50 shadow-2xs"
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold border ${
                isPlants ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  isPlants ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  Added
                </span>
              </div>
              <p className="text-xs font-black text-slate-900 truncate mt-1 max-w-[160px] sm:max-w-[210px]">
                {toast.title}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Added to cart • <strong className="text-slate-900">₹{toast.price ?? 0} / {toast.unitLabel || 'piece'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/checkout"
              onClick={() => setToast(null)}
              className={`h-9 px-3.5 rounded-xl text-white font-extrabold text-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-md ${
                isPlants
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              View Cart
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setToast(null)}
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
