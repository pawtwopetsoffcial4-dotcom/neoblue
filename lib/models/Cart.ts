import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  unitLabel?: string;
  packQty?: number;
  price?: number;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity cannot be less than 1'],
          default: 1,
        },
        unitLabel: {
          type: String,
        },
        packQty: {
          type: Number,
        },
        price: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true }
);

// TTL Index: automatically delete abandoned carts inactive for more than 15 days
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 15 * 24 * 60 * 60 });

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);
