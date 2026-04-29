export type MarketplaceProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  waterType: 'Freshwater' | 'Saltwater' | 'Brackish';
  vendorId: string;
  tag: string;
  rating: number;
  inStock: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  scientific?: string;
  createdAt?: string;
  updatedAt?: string;
};
