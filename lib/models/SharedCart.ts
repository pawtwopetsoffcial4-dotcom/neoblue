import mongoose, { Schema, Document } from 'mongoose';

export interface ISharedCartItem {
  productId: string;
  quantity: number;
}

export interface ISharedCart extends Document {
  code: string;
  items: ISharedCartItem[];
  createdAt: Date;
}

const SharedCartSchema = new Schema<ISharedCart>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000, // 30 days automatic expiration
    },
  },
  { timestamps: true }
);

export default mongoose.models.SharedCart || mongoose.model<ISharedCart>('SharedCart', SharedCartSchema);
