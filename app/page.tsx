import React from 'react';
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/utils/seo';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Combo from '@/lib/models/Combo';
import StoreConfig from '@/lib/models/StoreConfig';
import { PRODUCT_CATEGORIES, getCategoryImage } from '@/lib/catalog';

export const revalidate = 300; // 5 minutes edge cache

export const metadata: Metadata = {
  title: "NeoBlue: Buy Aquarium Fish & Live Plants Online India",
  description: "Shop healthy aquarium fish, live aquatic plants, shrimp & snails online. Live-arrival guaranteed delivery with detailed care parameters across India.",
  keywords: [
    "aquarium fish buy online",
    "live aquarium plants online",
    "buy guppy fish online India",
    "buy discus fish online",
    "cichlids aquarium fish",
    "freshwater aquarium pets",
    "aquarium plants India",
    "live fish delivery India",
    "NeoBlue store"
  ],
  alternates: {
    canonical: 'https://neoblue.in',
  },
};

const EMPTY_FALLBACK = {
  initialProducts: [],
  initialCombos: [],
  initialCategories: PRODUCT_CATEGORIES.map((name) => ({
    name,
    image: getCategoryImage(name),
  })),
  initialHeroSlides: [],
  initialHeroSlidesFishes: [],
  initialHeroSlidesPlants: [],
  initialConfig: null,
};

async function getHomepageData() {
  try {
    const fetchDb = async () => {
      await connectDB();
      const [productsRaw, combosRaw, configRaw] = await Promise.all([
        Product.find({ approvalStatus: 'approved', inStock: true })
          .select('title category subcategory images price perPairPrice perPiecePrice inStock')
          .sort({ createdAt: -1 })
          .limit(24)
          .lean()
          .maxTimeMS(2000),
        Combo.find({ isActive: true }).limit(8).lean().maxTimeMS(2000),
        StoreConfig.findOne({}).lean().maxTimeMS(2000),
      ]);
      return { productsRaw, combosRaw, configRaw };
    };

    // Strict 2000ms timeout ensures fast response times during ISR / SSR generation
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const result = await Promise.race([fetchDb(), timeoutPromise]);

    if (!result) {
      return EMPTY_FALLBACK;
    }

    const { productsRaw, combosRaw, configRaw } = result;
    const initialProducts = JSON.parse(JSON.stringify(productsRaw || []));
    const initialCombos = JSON.parse(JSON.stringify(combosRaw || []));
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
    console.warn('Failed to pre-fetch homepage data, using static fallback:', error);
    return EMPTY_FALLBACK;
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
