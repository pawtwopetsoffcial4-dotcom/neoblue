import React from 'react';
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/utils/seo';

export const metadata: Metadata = {
  title: "NeoBlue - Buy Aquarium Fish, Live Plants & Specs Online",
  description: "Shop premium quality aquarium fish, shrimp, snails, and live plants online. Browse species care specifications and get secure, live-arrival guaranteed delivery across India from NeoBlue.",
  keywords: ["aquarium fish buy online", "live aquarium plants online", "buy guppy fish online", "buy guppies online India", "freshwater aquarium pets", "aquarium specs", "NeoBlue shop", "live fish delivery India", "aquarium fish price India"],
  alternates: {
    canonical: 'https://neoblue.in',
  },
};

export default function HomePage() {
  const organizationJsonLd = buildOrganizationJsonLd();
  const webSiteJsonLd = buildWebSiteJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <HomeClient />
    </>
  );
}

