'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  const { user } = useAuth();

  // Load/merge carts on user change
  useEffect(() => {
    setIsLoaded(false);
    const rawUserCart = user ? localStorage.getItem(`neoblue-cart-${user.id}`) : null;
    const rawGuestCart = localStorage.getItem('neoblue-cart-guest');

    let userItems: CartItem[] = [];
    if (user && rawUserCart) {
      try {
        userItems = JSON.parse(rawUserCart);
      } catch {}
    }

    let guestItems: CartItem[] = [];
    if (rawGuestCart) {
      try {
        guestItems = JSON.parse(rawGuestCart);
      } catch {}
    }

    if (user) {
      if (guestItems.length > 0) {
        const merged = [...userItems];
        guestItems.forEach((gItem) => {
          const existing = merged.find((uItem) => uItem.productId === gItem.productId);
          if (existing) {
            existing.quantity += gItem.quantity;
          } else {
            merged.push(gItem);
          }
        });
        setItems(merged);
        localStorage.setItem(`neoblue-cart-${user.id}`, JSON.stringify(merged));
        localStorage.removeItem('neoblue-cart-guest');
      } else {
        setItems(userItems);
      }
    } else {
      setItems(guestItems);
    }
    setIsLoaded(true);
  }, [user]);

  // Save items to localStorage whenever they change, but ONLY after initial load completes
  useEffect(() => {
    if (!isLoaded) return;
    const key = user ? `neoblue-cart-${user.id}` : 'neoblue-cart-guest';
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, user, isLoaded]);

  const addToCart = (product: MarketplaceProduct) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...prev,
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] ?? '/api/placeholder/400/300',
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setItems([]);

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
