"use client";

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'neoblue_wishlist';
const EVENT_KEY = 'neoblue_wishlist_updated';

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadWishlist = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
        }
      } else {
        setWishlistIds([]);
      }
    } catch (e) {
      console.error('Error loading wishlist:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadWishlist();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadWishlist();
      }
    };

    const handleCustomEvent = () => {
      loadWishlist();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_KEY, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_KEY, handleCustomEvent);
    };
  }, [loadWishlist]);

  const toggleWishlist = useCallback((productId: string) => {
    if (typeof window === 'undefined' || !productId) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let current: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(current)) current = [];

      let updated: string[];
      const isAlreadyIn = current.includes(productId);

      if (isAlreadyIn) {
        updated = current.filter((id) => id !== productId);
      } else {
        updated = [...current, productId];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setWishlistIds(updated);
      window.dispatchEvent(new CustomEvent(EVENT_KEY));
      return !isAlreadyIn;
    } catch (e) {
      console.error('Error toggling wishlist:', e);
      return false;
    }
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const removeFromWishlist = useCallback((productId: string) => {
    if (typeof window === 'undefined' || !productId) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let current: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(current)) current = [];

      const updated = current.filter((id) => id !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setWishlistIds(updated);
      window.dispatchEvent(new CustomEvent(EVENT_KEY));
    } catch (e) {
      console.error('Error removing from wishlist:', e);
    }
  }, []);

  const clearWishlist = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    setWishlistIds([]);
    window.dispatchEvent(new CustomEvent(EVENT_KEY));
  }, []);

  return {
    wishlistIds,
    wishlistCount: wishlistIds.length,
    isLoaded,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
  };
}
