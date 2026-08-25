import mongoose from 'mongoose';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';

export interface IHeroSlide {
  id?: string;
  badge?: string;
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  bgImage?: string;
  mode?: 'all' | 'fishes' | 'plants';
}

export const DEFAULT_HERO_SLIDES: IHeroSlide[] = [
  {
    id: 'slide-1',
    badge: 'Limited Time Offer',
    title: 'Save Up to 35% on Premium Live Stock',
    description: 'Handpicked freshwater & marine species with overnight transit care and 100% live arrival guarantee.',
    buttonText: 'Shop All Livestock',
    buttonLink: '/products',
    bgImage: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1600&q=80',
    mode: 'all',
  },
  {
    id: 'slide-2',
    badge: 'Curated Breeders',
    title: 'Exotic Bettas, Guppies & Discus Pairs',
    description: 'Explore champion bloodlines directly from certified breeders across India.',
    buttonText: 'Explore Fishes',
    buttonLink: '/products',
    bgImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
    mode: 'fishes',
  },
  {
    id: 'slide-3',
    badge: '100% Snail-Free',
    title: 'Lush Aquatic Plants & Aquascapes',
    description: 'Transform your tank with vibrant carpeting flora, anubias, and easy-care mosses.',
    buttonText: 'Browse Plants',
    buttonLink: '/categories/plants',
    bgImage: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=1600&q=80',
    mode: 'plants',
  },
];

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