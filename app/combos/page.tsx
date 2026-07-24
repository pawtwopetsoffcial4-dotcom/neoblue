import React from 'react';
import type { Metadata } from 'next';
import CombosClient from './CombosClient';

export const metadata: Metadata = {
  title: 'Aquarium Fish Combo Packages - Curated Bundles | NeoBlue',
  description: 'Explore NeoBlue\'s exclusive combo packages — curated collections of premium live aquarium fish and plants bundled at unbeatable prices with live-arrival guarantee.',
  keywords: ['aquarium fish combo', 'fish bundle deals', 'aquarium starter pack', 'live fish combo India', 'NeoBlue combo'],
  alternates: {
    canonical: 'https://neoblue.in/combos',
  },
};

export default function CombosPage() {
  return <CombosClient />;
}
