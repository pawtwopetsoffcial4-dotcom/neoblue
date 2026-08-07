'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { X, CheckCircle2 } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useAuth } from './useAuth';

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: MarketplaceProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalAmount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState<{ id: number; title: string; image?: string; price?: number } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
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
    const existing = items.find((item) => item.productId === product._id);
    let newItems: CartItem[] = [];
    if (existing) {
      newItems = items.map((item) =>
        item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [
        ...items,
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] ?? '/api/placeholder/400/300',
          quantity: 1,
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
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
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
        cartCount,
        totalAmount,
      }}
    >
      {children}

      {/* Add To Cart Toast Notification */}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-center gap-3 min-w-0">
            {toast.image ? (
              <img
                src={toast.image}
                alt={toast.title}
                className="w-10 h-10 rounded-xl object-cover border border-slate-700/60 shrink-0 bg-slate-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 text-emerald-400 font-bold text-sm">
                ✓
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">
                  {toast.title} added
                </p>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Added to your cart • {toast.price ? `₹${toast.price}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/checkout"
              onClick={() => setToast(null)}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer shadow-xs"
            >
              View Cart
            </Link>
            <button
              onClick={() => setToast(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
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
