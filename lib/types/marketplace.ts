export type MarketplaceProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: 'Fish' | 'Coral' | 'Invertebrate' | 'Plant';
  waterType: 'Freshwater' | 'Saltwater' | 'Brackish';
  vendorId: string;
  tag: string;
  rating: number;
  inStock: boolean;
  scientific?: string;
  createdAt?: string;
  updatedAt?: string;
};
