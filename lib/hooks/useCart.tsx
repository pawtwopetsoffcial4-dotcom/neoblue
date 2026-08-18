'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useAuth } from './useAuth';
import { useMode } from './useMode';
import CartDrawer from '@/app/components/CartDrawer';

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  perPairPrice?: number | null;
  unitLabel?: string;
  weightPerPiece?: number;
  category?: string;
  waterType?: string;
  scientific?: string;
  originalPrice?: number;
  discountPercentage?: number;
  vendorId?: string;
  vendorName?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: MarketplaceProduct, openDrawer?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  loadSharedCart: (sharedItems: CartItem[], action: 'merge' | 'replace') => void;
  cartCount: number;
  totalAmount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<{ id: number; title: string; image?: string; price: number; unitLabel?: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { mode } = useMode();
  const isPlants = mode === 'plants';
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

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

  const addToCart = (product: MarketplaceProduct, openDrawer: boolean = true) => {
    const existingIndex = items.findIndex((item) => item.productId === product._id);
    let newItems: CartItem[] = [];
    const isPair = (product as any).perPairPrice != null;
    const unitLabel = isPair ? 'pair' : 'piece';
    const weightPerPiece = product.weightPerPiece && product.weightPerPiece > 0
      ? product.weightPerPiece
      : (product.category === 'Plants' ? 80 : 100);

    const vendorId = typeof product.vendorId === 'object' && product.vendorId !== null 
      ? product.vendorId._id 
      : product.vendorId;
    const vendorName = typeof product.vendorId === 'object' && product.vendorId !== null 
      ? product.vendorId.name 
      : undefined;

    if (existingIndex > -1) {
      newItems = [...items];
      newItems[existingIndex].quantity += 1;
      if (!newItems[existingIndex].unitLabel) {
        newItems[existingIndex].unitLabel = unitLabel;
      }
      if (!newItems[existingIndex].weightPerPiece) {
        newItems[existingIndex].weightPerPiece = weightPerPiece;
      }
    } else {
      newItems = [
        ...items,
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] ?? '/illustrations/placeholder.png',
          quantity: 1,
          perPairPrice: (product as any).perPairPrice ?? null,
          unitLabel,
          weightPerPiece,
          category: product.category,
          waterType: product.waterType,
          scientific: product.scientific,
          originalPrice: product.originalPrice,
          discountPercentage: product.discountPercentage,
          vendorId: vendorId ? String(vendorId) : undefined,
          vendorName,
        },
      ];
    }
    setItems(newItems);
    syncCartToDB(newItems);

    if (openDrawer) {
      setIsCartOpen(true);
    }
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
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
      <CartDrawer />
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
