import React from 'react';
import type { Metadata } from 'next';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: "Buy Aquarium Fish & Live Plants Online - NeoBlue Shop",
  description: "Browse our premium selection of freshwater aquarium fish, shrimp, snails, and live aquatic plants. Filter by category, temperament, and care parameters with secure live-arrival guarantee.",
  keywords: ["aquarium fish shop online", "buy live plants online", "aquarium fish price India", "shrimp snail store", "aquarium pets online"],
  alternates: {
    canonical: 'https://neoblue.in/products',
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
