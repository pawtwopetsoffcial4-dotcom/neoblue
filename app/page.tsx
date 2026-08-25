import React from 'react';
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/utils/seo';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Combo from '@/lib/models/Combo';
import StoreConfig from '@/lib/models/StoreConfig';
import { PRODUCT_CATEGORIES, getCategoryImage } from '@/lib/catalog';

export const revalidate = 60; // Revalidate every 60 seconds (Instant server cache)

export const metadata: Metadata = {
  title: "NeoBlue - Buy Aquarium Fish, Live Plants & Specs Online",
  description: "Shop premium quality aquarium fish, shrimp, snails, and live plants online. Browse species care specifications and get secure, live-arrival guaranteed delivery across India from NeoBlue.",
  keywords: ["aquarium fish buy online", "live aquarium plants online", "buy guppy fish online", "buy guppies online India", "freshwater aquarium pets", "aquarium specs", "NeoBlue shop", "live fish delivery India", "aquarium fish price India"],
  alternates: {
    canonical: 'https://neoblue.in',
  },
};

async function getHomepageData() {
  try {
    await connectDB();

    const [productsRaw, combosRaw, configRaw] = await Promise.all([
      Product.find({ approvalStatus: 'approved', inStock: true })
        .populate('vendorId', 'name logo slug')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      Combo.find({ isActive: true }).lean(),
      StoreConfig.findOne({}).lean(),
    ]);

    const initialProducts = JSON.parse(JSON.stringify(productsRaw));
    const initialCombos = JSON.parse(JSON.stringify(combosRaw));
    const config = JSON.parse(JSON.stringify(configRaw || {}));

    const configuredCategories = Array.isArray(config?.categories) && config.categories.length > 0
      ? config.categories
      : PRODUCT_CATEGORIES;

    const initialCategories = configuredCategories.map((name: string) => ({
      name,
      image: config?.categoryImages?.[name] || getCategoryImage(name),
    }));

    const initialHeroSlides = Array.isArray(config?.heroSlides) && config.heroSlides.length > 0
      ? config.heroSlides
      : [];

    const initialHeroSlidesFishes = Array.isArray(config?.heroSlidesFishes) && config.heroSlidesFishes.length > 0
      ? config.heroSlidesFishes
      : [];

    const initialHeroSlidesPlants = Array.isArray(config?.heroSlidesPlants) && config.heroSlidesPlants.length > 0
      ? config.heroSlidesPlants
      : [];

    return { 
      initialProducts, 
      initialCombos, 
      initialCategories, 
      initialHeroSlides, 
      initialHeroSlidesFishes, 
      initialHeroSlidesPlants, 
      initialConfig: config 
    };
  } catch (error) {
    console.error('Failed to pre-fetch homepage data:', error);
    return { 
      initialProducts: [], 
      initialCombos: [], 
      initialCategories: [], 
      initialHeroSlides: [], 
      initialHeroSlidesFishes: [], 
      initialHeroSlidesPlants: [], 
      initialConfig: null 
    };
  }
}

export default async function HomePage() {
  const organizationJsonLd = buildOrganizationJsonLd();
  const webSiteJsonLd = buildWebSiteJsonLd();
  const { 
    initialProducts, 
    initialCombos, 
    initialCategories, 
    initialHeroSlides,
    initialHeroSlidesFishes,
    initialHeroSlidesPlants,
    initialConfig 
  } = await getHomepageData();

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
      <HomeClient 
        initialProducts={initialProducts} 
        initialCombos={initialCombos}
        initialCategories={initialCategories}
        initialHeroSlides={initialHeroSlides}
        initialHeroSlidesFishes={initialHeroSlidesFishes}
        initialHeroSlidesPlants={initialHeroSlidesPlants}
        initialConfig={initialConfig}
      />
    </>
  );
}

