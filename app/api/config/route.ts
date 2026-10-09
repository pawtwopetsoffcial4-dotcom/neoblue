import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PRODUCT_CATEGORIES, PRODUCT_CATALOG, normalizeCategoryName } from '@/lib/catalog';
import StoreConfig, { 
  DEFAULT_HERO_SLIDES, 
  DEFAULT_FISHES_HERO_SLIDES, 
  DEFAULT_PLANTS_HERO_SLIDES 
} from '@/lib/models/StoreConfig';

export const dynamic = 'force-dynamic';

const DEFAULT_CONFIG_RESPONSE = {
  heroSlides: DEFAULT_HERO_SLIDES,
  heroSlidesFishes: DEFAULT_FISHES_HERO_SLIDES,
  heroSlidesPlants: DEFAULT_PLANTS_HERO_SLIDES,
  facebookPixelId: process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '1689531238818724',
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID || '',
  minOrderAmount: 149,
  paymentGateway: 'razorpay',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  categories: PRODUCT_CATEGORIES,
  excludedCategories: [],
  subcategories: PRODUCT_CATALOG,
  marqueeText: 'Next shipping on Monday! Order fast for fastest delivery.',
  marqueeEnabled: true,
  marqueeLink: '/products',
  offerBadge: 'Limited Time Offer',
  offerTitle: 'Save Up To 35% On\nPremium Aquatic Stock',
  offerDescription: 'Weekend special: handpicked marine and freshwater species, overnight transit care, and live-arrival protection included.',
  offerButtonText: 'Shop The Offer',
  offerButtonLink: '/products',
  stat1Value: '500+',
  stat1Label: 'Species Curated',
  stat2Value: '24h',
  stat2Label: 'Priority Dispatch',
  stat3Value: '100%',
  stat3Label: 'Live Arrival Cover',
  freeShippingEnabled: true,
  freeShippingMinAmount: 599,
};

// Resilient GET implementation: always returns 200 with valid config data
export async function GET() {
  try {
    const fetchDbConfig = async () => {
      await connectDB();
      return await StoreConfig.findOne({}).lean().maxTimeMS(2500);
    };

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const config = await Promise.race([fetchDbConfig(), timeoutPromise]);

    if (!config) {
      return NextResponse.json(DEFAULT_CONFIG_RESPONSE);
    }

    const payload = config as Record<string, any>;
    const { shippingPerPiece, shippingPerWeight, ...rest } = payload;

    const excludedList: string[] = Array.isArray(payload.excludedCategories) ? payload.excludedCategories : [];
    const excludedSet = new Set(excludedList.map((c: string) => normalizeCategoryName(c).toLowerCase()));
    const rawCategories: string[] = Array.isArray(payload.categories) && payload.categories.length ? payload.categories : PRODUCT_CATEGORIES;
    const filteredCategories = rawCategories.filter((c: string) => !excludedSet.has(normalizeCategoryName(c).toLowerCase()));

    return NextResponse.json({
      ...DEFAULT_CONFIG_RESPONSE,
      ...rest,
      heroSlides: Array.isArray(payload.heroSlides) && payload.heroSlides.length > 0 ? payload.heroSlides : DEFAULT_HERO_SLIDES,
      heroSlidesFishes: Array.isArray(payload.heroSlidesFishes) && payload.heroSlidesFishes.length > 0 ? payload.heroSlidesFishes : DEFAULT_FISHES_HERO_SLIDES,
      heroSlidesPlants: Array.isArray(payload.heroSlidesPlants) && payload.heroSlidesPlants.length > 0 ? payload.heroSlidesPlants : DEFAULT_PLANTS_HERO_SLIDES,
      facebookPixelId: payload.facebookPixelId || process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '1689531238818724',
      googleAnalyticsId: payload.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID || '',
      minOrderAmount: Math.min(149, Number(payload.minOrderAmount) || 149),
      paymentGateway: payload.paymentGateway || 'razorpay',
      razorpayKeyId: payload.razorpayKeyId || process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      razorpayKeySecret: payload.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '',
      categories: filteredCategories,
      excludedCategories: excludedList,
      subcategories: payload.subcategories && Object.keys(payload.subcategories).length ? payload.subcategories : PRODUCT_CATALOG,
      marqueeText: payload.marqueeText ?? 'Next shipping on Monday! Order fast for fastest delivery.',
      marqueeEnabled: payload.marqueeEnabled !== false,
      marqueeLink: payload.marqueeLink ?? '/products',
    });
  } catch (error) {
    console.warn('Config GET fallback to defaults:', error);
    return NextResponse.json(DEFAULT_CONFIG_RESPONSE);
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const raw = await request.json();

    const data: any = { ...raw };
    delete data.shippingPerPiece;
    delete data.shippingPerWeight;

    if (Array.isArray(raw?.excludedCategories)) {
      data.excludedCategories = Array.from(new Set(raw.excludedCategories.map((c: string) => normalizeCategoryName(c)).filter(Boolean)));
    }

    if (Array.isArray(raw?.categories)) {
      const uniqueCats = new Set<string>();
      for (const c of raw.categories) {
        if (typeof c === 'string' && c.trim().length > 0) {
          const norm = normalizeCategoryName(c);
          if (norm) uniqueCats.add(norm);
        }
      }
      data.categories = Array.from(uniqueCats);

      if (Array.isArray(data.excludedCategories)) {
        const addedSet = new Set(data.categories.map((c: string) => c.toLowerCase()));
        data.excludedCategories = data.excludedCategories.filter((c: string) => !addedSet.has(c.toLowerCase()));
      }
    }

    const config = await StoreConfig.findOneAndUpdate({}, { $set: data }, { new: true, upsert: true });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Config PUT error:', error);
    const message = error instanceof Error ? error.message : 'Error saving config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}