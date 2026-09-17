import mongoose, { Schema, Document } from 'mongoose';
import { normalizeCategoryName } from '@/lib/catalog';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  images: string[];
  videos?: string[];
  category: string;
  subcategory?: string;
  waterType: 'Freshwater' | 'Saltwater' | 'Brackish';
  vendorId: mongoose.Types.ObjectId;
  tag: string;
  rating: number;
  reviewsCount?: number;
  inStock: boolean;
  stockQuantity?: number;
  soldQuantity?: number;
  soldAfterLastStockUpdate?: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  scientific?: string;
  size?: string;
  ageCategory?: string;
  originalPrice?: number;
  sellerPrice?: number;
  initialVendorPrice?: number;
  discountPercentage?: number;
  perPiecePrice?: number;
  perPairPrice?: number;
  weightPerPiece?: number;
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
  phMin?: number;
  phMax?: number;
  tempMin?: number;
  tempMax?: number;
  temperament?: 'Peaceful' | 'Semi-aggressive' | 'Aggressive';
  isTrending?: boolean;
  isNewArrival?: boolean;
  faq?: Array<{ q: string; a: string }>;
  quickOverview?: string;
  aboutSpecies?: string;
  behavioralTraits?: string;
  genderIdentification?: string;
  sustainabilitySourcing?: string;
  section5Title?: string;
  section5Content?: string;
  careTemp?: string;
  carePh?: string;
  careWaterHardness?: string;
  careWaterCurrent?: string;
  careTankSetup?: string;
  careHidingSpots?: string;
  // Plant specific fields
  lightingRequirement?: 'Low' | 'Medium' | 'High';
  co2Requirement?: 'None' | 'Recommended' | 'High';
  growthRate?: 'Slow' | 'Moderate' | 'Fast';
  placement?: 'Foreground' | 'Midground' | 'Background' | 'Floating' | 'Epiphyte';
  careDifficulty?: 'Easy' | 'Moderate' | 'Advanced';
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
    sellerPrice: {
      type: Number,
      min: 0,
    },
    initialVendorPrice: {
      type: Number,
      min: 0,
    },
    images: {
      type: [String],
      required: [true, 'Please provide at least one image'],
    },
    videos: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: true,
      trim: true,
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
      default: 0,
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
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldQuantity: {
      type: Number,
      default: 0,
      min: 0,
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
    weightPerPiece: {
      type: Number,
      default: 0,
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
    phMin: {
      type: Number,
      default: 6.0,
    },
    phMax: {
      type: Number,
      default: 8.0,
    },
    tempMin: {
      type: Number,
      default: 20,
    },
    tempMax: {
      type: Number,
      default: 30,
    },
    temperament: {
      type: String,
      enum: ['Peaceful', 'Semi-aggressive', 'Aggressive'],
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: '',
    },
    ageCategory: {
      type: String,
      default: 'adult',
    },
    soldAfterLastStockUpdate: {
      type: Number,
      default: 0,
    },
    faq: {
      type: [{
        q: { type: String, required: true },
        a: { type: String, required: true }
      }],
      default: []
    },
    quickOverview: { type: String, default: '' },
    aboutSpecies: { type: String, default: '' },
    behavioralTraits: { type: String, default: '' },
    genderIdentification: { type: String, default: '' },
    sustainabilitySourcing: { type: String, default: '' },
    section5Title: { type: String, default: '' },
    section5Content: { type: String, default: '' },
    careTemp: { type: String, default: '' },
    carePh: { type: String, default: '' },
    careWaterHardness: { type: String, default: '' },
    careWaterCurrent: { type: String, default: '' },
    careTankSetup: { type: String, default: '' },
    careHidingSpots: { type: String, default: '' },
    // Plant specific fields
    lightingRequirement: { type: String, enum: ['Low', 'Medium', 'High'] },
    co2Requirement: { type: String, enum: ['None', 'Recommended', 'High'] },
    growthRate: { type: String, enum: ['Slow', 'Moderate', 'Fast'] },
    placement: { type: String, enum: ['Foreground', 'Midground', 'Background', 'Floating', 'Epiphyte'] },
    careDifficulty: { type: String, enum: ['Easy', 'Moderate', 'Advanced'] },
  },
  { timestamps: true }
);

// Automatic category normalization middleware
productSchema.pre('validate', function () {
  if (this.category) {
    this.category = normalizeCategoryName(this.category);
  }
});

productSchema.pre('save', function () {
  if (this.category) {
    this.category = normalizeCategoryName(this.category);
  }
});

productSchema.pre('findOneAndUpdate', function () {
  const update: any = this.getUpdate();
  if (update?.category) {
    update.category = normalizeCategoryName(update.category);
  }
  if (update?.$set?.category) {
    update.$set.category = normalizeCategoryName(update.$set.category);
  }
});

// Indexes for common queries
productSchema.index({ category: 1, inStock: 1, approvalStatus: 1 });
productSchema.index({ vendorId: 1, approvalStatus: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
