'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
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
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
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
          // Fetch user's cart from database
          const response = await fetch('/api/cart');
          if (response.ok) {
            const data = await response.json();
            const dbItems: CartItem[] = data.items || [];

            if (guestItems.length > 0) {
              // Merge guest items with database items
              const merged = [...dbItems];
              guestItems.forEach((gItem) => {
                const existing = merged.find((uItem) => uItem.productId === gItem.productId);
                if (existing) {
                  existing.quantity += gItem.quantity;
                } else {
                  merged.push(gItem);
                }
              });

              // Save merged cart to database
              const saveResponse = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
              // Clear guest cart
              localStorage.removeItem('neoblue-cart-guest');
            } else {
              setItems(dbItems);
            }
          } else {
            // Fallback to local storage on API failure
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
        // Guest user: load from local storage
        setItems(guestItems);
      }
      setIsLoaded(true);
    };

    loadCart();
  }, [user]);

  // Save items to localStorage whenever they change, but ONLY after initial load completes (serves as fallback backup)
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
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
