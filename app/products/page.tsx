import React from 'react';
import type { Metadata } from 'next';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: "Buy Live Aquarium Fish & Plants Online: NeoBlue Shop",
  description: "Browse premium freshwater aquarium fish, shrimp, snails & live aquatic plants. Filter by species care specs with live-arrival guaranteed delivery.",
  keywords: [
    "aquarium fish shop online",
    "buy live plants online India",
    "aquarium fish price India",
    "shrimp snail store",
    "guppy betta discus cichlids online"
  ],
  alternates: {
    canonical: 'https://neoblue.in/products',
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
