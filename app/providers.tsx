"use client";

import React from 'react';
import { AuthProvider } from "@/lib/hooks/useAuth";
import { CartProvider } from "@/lib/hooks/useCart";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
