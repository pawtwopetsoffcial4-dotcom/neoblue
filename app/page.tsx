import React from 'react';
import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: "NeoBlue - Buy Aquarium Fish, Live Plants & Specs Online",
  description: "Shop premium quality aquarium fish, shrimp, snails, and live plants online. Browse species care specifications and get secure, live-arrival guaranteed delivery across India from NeoBlue.",
  keywords: ["aquarium fish buy online", "live aquarium plants online", "buy guppy fish online", "freshwater aquarium pets", "aquarium specs", "NeoBlue shop"],
  alternates: {
    canonical: 'https://neoblue.in',
  },
};

export default function HomePage() {
  return <HomeClient />;
}
