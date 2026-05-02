import mongoose from 'mongoose';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';

export interface IStoreConfig {
  offerBadge: string;
  offerTitle: string;
  offerDescription: string;
  offerButtonText: string;
  offerButtonLink: string;
  categories: string[];
  categoryImages?: Record<string, string>;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
}

const StoreConfigSchema = new mongoose.Schema<IStoreConfig>(
  {
    offerBadge: { type: String, default: 'Limited Time Offer' },
    offerTitle: { type: String, default: 'Save Up To 35% On\\nPremium Aquatic Stock' },
    offerDescription: { type: String, default: 'Weekend special: handpicked marine and freshwater species, overnight transit care, and live-arrival protection included.' },
    offerButtonText: { type: String, default: 'Shop The Offer' },
    offerButtonLink: { type: String, default: '/products' },
    categories: { type: [String], default: PRODUCT_CATEGORIES },
    categoryImages: { type: Map, of: String, default: {} },
    stat1Value: { type: String, default: '500+' },
    stat1Label: { type: String, default: 'Species Curated' },
    stat2Value: { type: String, default: '24h' },
    stat2Label: { type: String, default: 'Priority Dispatch' },
    stat3Value: { type: String, default: '100%' },
    stat3Label: { type: String, default: 'Live Arrival Cover' },
  },
  { timestamps: true }
);

export default mongoose.models.StoreConfig || mongoose.model<IStoreConfig>('StoreConfig', StoreConfigSchema);