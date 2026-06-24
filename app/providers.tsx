"use client";

import React from 'react';
import { AuthProvider } from "@/lib/hooks/useAuth";
import { CartProvider } from "@/lib/hooks/useCart";
import { ModeProvider } from "@/lib/hooks/useMode";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ModeProvider>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </ModeProvider>
  );
}
