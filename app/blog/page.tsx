import React from 'react';
import type { Metadata } from 'next';
import BlogClient from './BlogClient';

export const metadata: Metadata = {
  title: "NeoBlue Insights - Aquarium Fish Care, Setup & Guides",
  description: "Learn how to care for your aquarium pets, set up aquascapes, manage water parameters, and breed freshwater fish with expert articles and insights from the NeoBlue team.",
  keywords: ["aquarium fish care guide", "aquascaping setup tips", "fish breeding guides", "aquatic pets insights", "NeoBlue blog"],
  alternates: {
    canonical: 'https://neoblue.in/blog',
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
