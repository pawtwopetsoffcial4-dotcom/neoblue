export type MarketplaceProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: 'Guppies' | 'Betta' | "Angel's" | 'Discuss' | 'Platy' | 'Exotic Molly' | 'Zebra';
  waterType: 'Freshwater' | 'Saltwater' | 'Brackish';
  vendorId: string;
  tag: string;
  rating: number;
  inStock: boolean;
  scientific?: string;
  createdAt?: string;
  updatedAt?: string;
};
