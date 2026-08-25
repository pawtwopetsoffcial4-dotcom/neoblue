import mongoose from 'mongoose';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { IHeroSlide, DEFAULT_HERO_SLIDES } from '@/lib/types/config';

export * from '@/lib/types/config';

export interface IStoreConfig {
  offerBadge: string;
  offerTitle: string;
  offerDescription: string;
  offerButtonText: string;
  offerButtonLink: string;
  heroSlides?: IHeroSlide[];
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
}

const HeroSlideSchema = new mongoose.Schema(
  {
    id: { type: String },
    badge: { type: String, default: 'Special Offer' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    buttonText: { type: String, default: 'Shop Now' },
    buttonLink: { type: String, default: '/products' },
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
    heroBgImage: { type: String, default: '' },
    categories: { type: [String], default: PRODUCT_CATEGORIES },
    categoryImages: { type: mongoose.Schema.Types.Mixed, default: {} },
    subcategories: { type: mongoose.Schema.Types.Mixed, default: {} },
    stat1Value: { type: String, default: '500+' },
    stat1Label: { type: String, default: 'Species Curated' },
    stat2Value: { type: String, default: '24h' },
    stat2Label: { type: String, default: 'Priority Dispatch' },
    stat3Value: { type: String, default: '100%' },
    stat3Label: { type: String, default: 'Live Arrival Cover' },
    freeShippingEnabled: { type: Boolean, default: false },
    freeShippingMinAmount: { type: Number, default: 1499 },
  },
  { timestamps: true }
);

export default mongoose.models.StoreConfig || mongoose.model<IStoreConfig>('StoreConfig', StoreConfigSchema);