import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PRODUCT_CATEGORIES, PRODUCT_CATALOG, normalizeCategoryName } from '@/lib/catalog';
import StoreConfig, { 
  DEFAULT_HERO_SLIDES, 
  DEFAULT_FISHES_HERO_SLIDES, 
  DEFAULT_PLANTS_HERO_SLIDES 
} from '@/lib/models/StoreConfig';

// Single, clean GET/PUT implementation for /api/config
export async function GET() {
  try {
    await connectDB();
    let config = await StoreConfig.findOne({});
    if (!config) {
      config = await StoreConfig.create({});
    }

    const payload = config.toObject ? config.toObject() : config;
    const { shippingPerPiece, shippingPerWeight, ...rest } = payload as Record<string, any>;

    return NextResponse.json({
      ...rest,
      heroSlides: Array.isArray(payload.heroSlides) && payload.heroSlides.length > 0 ? payload.heroSlides : DEFAULT_HERO_SLIDES,
      heroSlidesFishes: Array.isArray(payload.heroSlidesFishes) && payload.heroSlidesFishes.length > 0 ? payload.heroSlidesFishes : DEFAULT_FISHES_HERO_SLIDES,
      heroSlidesPlants: Array.isArray(payload.heroSlidesPlants) && payload.heroSlidesPlants.length > 0 ? payload.heroSlidesPlants : DEFAULT_PLANTS_HERO_SLIDES,
      facebookPixelId: payload.facebookPixelId || '1689531238818724',
      categories: Array.isArray(payload.categories) && payload.categories.length ? payload.categories : PRODUCT_CATEGORIES,
      subcategories: payload.subcategories && Object.keys(payload.subcategories).length ? payload.subcategories : PRODUCT_CATALOG,
    });
  } catch (error) {
    console.error('Config GET error:', error);
    const message = error instanceof Error ? error.message : 'Error fetching config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const raw = await request.json();

    const data: any = { ...raw };
    delete data.shippingPerPiece;
    delete data.shippingPerWeight;
    if (Array.isArray(raw?.categories)) {
      const uniqueCats = new Set<string>();
      for (const c of raw.categories) {
        if (typeof c === 'string' && c.trim().length > 0) {
          const norm = normalizeCategoryName(c);
          if (norm) uniqueCats.add(norm);
        }
      }
      data.categories = Array.from(uniqueCats);
    }

    const config = await StoreConfig.findOneAndUpdate({}, { $set: data }, { new: true, upsert: true });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Config PUT error:', error);
    const message = error instanceof Error ? error.message : 'Error saving config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}