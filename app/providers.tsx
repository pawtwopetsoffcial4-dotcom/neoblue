"use client";

import React from 'react';
import { AuthProvider } from "@/lib/hooks/useAuth";
import { CartProvider } from "@/lib/hooks/useCart";
import { ModeProvider } from "@/lib/hooks/useMode";
import { NotificationProvider } from "@/lib/hooks/useNotifications";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ModeProvider>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </ModeProvider>
  );
}
