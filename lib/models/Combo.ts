import mongoose, { Schema, Document } from 'mongoose';

export interface IComboProduct {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ICombo extends Document {
  name: string;
  description: string;
  products: IComboProduct[];
  price: number;
  originalPrice?: number;
  coverImage: string;
  images?: string[];
  isActive: boolean;
  isFeatured: boolean;
  tag?: string;
  shippingCharge?: number;
  createdAt: Date;
  updatedAt: Date;
}

const comboSchema = new Schema<ICombo>(
  {
    name: {
      type: String,
      required: [true, 'Please provide combo name'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide combo description'],
      trim: true,
    },
    products: {
      type: [
        {
          productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
          },
        },
      ],
      validate: {
        validator: function (arr: IComboProduct[]) {
          return arr.length >= 2;
        },
        message: 'A combo must contain at least 2 products',
      },
    },
    price: {
      type: Number,
      required: [true, 'Please provide combo price'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    coverImage: {
      type: String,
      required: [true, 'Please provide a cover image'],
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    tag: {
      type: String,
      default: '',
      trim: true,
    },
    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

comboSchema.index({ isActive: 1, isFeatured: 1 });
comboSchema.index({ createdAt: -1 });

export default mongoose.models.Combo || mongoose.model<ICombo>('Combo', comboSchema);
