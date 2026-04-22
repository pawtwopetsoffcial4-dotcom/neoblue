import mongoose, { Schema, Document } from 'mongoose';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  images: string[];
  category:
    | 'Guppies'
    | 'Crayfish'
    | 'Kribensis'
    | 'Betta'
    | "Angel's"
    | 'Discuss'
    | 'Platy'
    | 'Exotic Molly'
    | 'Zebra';
  subcategory?: string;
  waterType: 'Freshwater' | 'Saltwater' | 'Brackish';
  vendorId: mongoose.Types.ObjectId;
  tag: string;
  rating: number;
  inStock: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  scientific?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Please provide product title'],
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide product price'],
      min: 0,
    },
    images: {
      type: [String],
      required: [true, 'Please provide at least one image'],
    },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      required: true,
    },
    subcategory: {
      type: String,
      default: '',
    },
    waterType: {
      type: String,
      enum: ['Freshwater', 'Saltwater', 'Brackish'],
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tag: {
      type: String,
      default: 'Standard',
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    scientific: String,
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
