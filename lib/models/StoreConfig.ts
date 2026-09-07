import mongoose from 'mongoose';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { 
  IHeroSlide, 
  DEFAULT_FISHES_HERO_SLIDES, 
  DEFAULT_PLANTS_HERO_SLIDES, 
  DEFAULT_HERO_SLIDES 
} from '@/lib/types/config';

export * from '@/lib/types/config';

export interface IStoreConfig {
  offerBadge: string;
  offerTitle: string;
  offerDescription: string;
  offerButtonText: string;
  offerButtonLink: string;
  heroSlides?: IHeroSlide[];
  heroSlidesFishes?: IHeroSlide[];
  heroSlidesPlants?: IHeroSlide[];
  heroBgImage?: string;
  categories: string[];
  categoryImages?: Record<string, string>;
  subcategories?: Record<string, string[]>;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  freeShippingEnabled?: boolean;
  freeShippingMinAmount?: number;
  minOrderAmount?: number;
  facebookPixelId?: string;
  googleAnalyticsId?: string;
  marqueeText?: string;
  marqueeEnabled?: boolean;
  marqueeLink?: string;
}

const HeroButtonSchema = new mongoose.Schema(
  {
    id: { type: String },
    text: { type: String, required: true },
    link: { type: String, required: true },
    variant: { type: String, enum: ['primary', 'secondary', 'glass'], default: 'primary' },
  },
  { _id: false }
);

const HeroSlideSchema = new mongoose.Schema(
  {
    id: { type: String },
    badge: { type: String, default: 'Special Offer' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    buttonText: { type: String, default: 'Shop Now' },
    buttonLink: { type: String, default: '/products' },
    buttons: { type: [HeroButtonSchema], default: [] },
    bgImage: { type: String, default: '' },
    mode: { type: String, enum: ['all', 'fishes', 'plants'], default: 'all' },
  },
  { _id: false }
);

const StoreConfigSchema = new mongoose.Schema<IStoreConfig>(
  {
    offerBadge: { type: String, default: 'Limited Time Offer' },
    offerTitle: { type: String, default: 'Save Up To 35% On\\nPremium Aquatic Stock' },
    offerDescription: { type: String, default: 'Weekend special: handpicked marine and freshwater species, overnight transit care, and live-arrival protection included.' },
    offerButtonText: { type: String, default: 'Shop The Offer' },
    offerButtonLink: { type: String, default: '/products' },
    heroSlides: { type: [HeroSlideSchema], default: DEFAULT_HERO_SLIDES },
    heroSlidesFishes: { type: [HeroSlideSchema], default: DEFAULT_FISHES_HERO_SLIDES },
    heroSlidesPlants: { type: [HeroSlideSchema], default: DEFAULT_PLANTS_HERO_SLIDES },
    heroBgImage: { type: String, default: '' },
    facebookPixelId: { type: String, default: () => process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '1689531238818724' },
    googleAnalyticsId: { type: String, default: () => process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID || '' },
    categories: { type: [String], default: PRODUCT_CATEGORIES },
    categoryImages: { type: mongoose.Schema.Types.Mixed, default: {} },
    subcategories: { type: mongoose.Schema.Types.Mixed, default: {} },
    stat1Value: { type: String, default: '500+' },
    stat1Label: { type: String, default: 'Species Curated' },
    stat2Value: { type: String, default: '24h' },
    stat2Label: { type: String, default: 'Priority Dispatch' },
    stat3Value: { type: String, default: '100%' },
    stat3Label: { type: String, default: 'Live Arrival Cover' },
    freeShippingEnabled: { type: Boolean, default: true },
    freeShippingMinAmount: { type: Number, default: 599 },
    minOrderAmount: { type: Number, default: 150 },
    marqueeText: { type: String, default: 'Next shipping on Monday! Order fast for fastest delivery.' },
    marqueeEnabled: { type: Boolean, default: true },
    marqueeLink: { type: String, default: '/products' },
  },
  { timestamps: true }
);

export default mongoose.models.StoreConfig || mongoose.model<IStoreConfig>('StoreConfig', StoreConfigSchema);