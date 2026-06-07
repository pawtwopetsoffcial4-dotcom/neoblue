import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  waterType: 'Freshwater' | 'Saltwater' | 'Brackish';
  vendorId: mongoose.Types.ObjectId;
  tag: string;
  rating: number;
  reviewsCount?: number;
  inStock: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  scientific?: string;
  originalPrice?: number;
  discountPercentage?: number;
  perPiecePrice?: number;
  perPairPrice?: number;
  shippingType?: 'piece' | 'weight';
  shippingCharge?: number;
  shippingLotSize?: number;
  shippingPieceRanges?: Array<{
    id: string;
    pieceRange: string;
    estimatedQuantity: string;
    charge: number;
  }>;
  shippingWeightRanges?: Array<{
    id: string;
    weightRange: string;
    estimatedQuantity: string;
    charge: number;
  }>;
  shippingNorth1Ranges?: Array<{ id: string; weightRange: string; estimatedQuantity: string; charge: number; }>;
  shippingNorth2Ranges?: Array<{ id: string; weightRange: string; estimatedQuantity: string; charge: number; }>;
  shippingNorth3Ranges?: Array<{ id: string; weightRange: string; estimatedQuantity: string; charge: number; }>;
  shippingNorth4Ranges?: Array<{ id: string; weightRange: string; estimatedQuantity: string; charge: number; }>;
  shippingSouth1Ranges?: Array<{ id: string; weightRange: string; estimatedQuantity: string; charge: number; }>;
  shippingSouth2Ranges?: Array<{ id: string; weightRange: string; estimatedQuantity: string; charge: number; }>;
  shippingSouth3Ranges?: Array<{ id: string; weightRange: string; estimatedQuantity: string; charge: number; }>;
  shippingSouth4Ranges?: Array<{ id: string; weightRange: string; estimatedQuantity: string; charge: number; }>;
  deliverNorth?: boolean;
  deliverSouth?: boolean;
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
    reviewsCount: {
      type: Number,
      default: 0,
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
    originalPrice: {
      type: Number,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    perPiecePrice: {
      type: Number,
      min: 0,
    },
    perPairPrice: {
      type: Number,
      min: 0,
    },
    shippingType: {
      type: String,
      enum: ['piece', 'weight'],
      default: 'piece',
    },
    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingLotSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    shippingPieceRanges: [
      {
        id: String,
        pieceRange: String,
        estimatedQuantity: String,
        charge: Number,
      }
    ],
    shippingWeightRanges: [
      {
        id: String,
        weightRange: String,
        estimatedQuantity: String,
        charge: Number,
      }
    ],
    shippingNorth1Ranges: [{ id: String, weightRange: String, estimatedQuantity: String, charge: Number }],
    shippingNorth2Ranges: [{ id: String, weightRange: String, estimatedQuantity: String, charge: Number }],
    shippingNorth3Ranges: [{ id: String, weightRange: String, estimatedQuantity: String, charge: Number }],
    shippingNorth4Ranges: [{ id: String, weightRange: String, estimatedQuantity: String, charge: Number }],
    shippingSouth1Ranges: [{ id: String, weightRange: String, estimatedQuantity: String, charge: Number }],
    shippingSouth2Ranges: [{ id: String, weightRange: String, estimatedQuantity: String, charge: Number }],
    shippingSouth3Ranges: [{ id: String, weightRange: String, estimatedQuantity: String, charge: Number }],
    shippingSouth4Ranges: [{ id: String, weightRange: String, estimatedQuantity: String, charge: Number }],
    deliverNorth: {
      type: Boolean,
      default: true,
    },
    deliverSouth: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
