import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  products: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAmount?: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
    phone: string;
  };
  status: 'pending' | 'placed' | 'accepted' | 'preparing' | 'shipped' | 'completed' | 'cancelled';
  stockDecremented?: boolean;
  paymentId?: string;
  razorpayOrderId?: string;
  cashfreeOrderId?: string;
  notes?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingLink?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [
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
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipcode: { type: String, required: true },
      phone: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'placed', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled'],
      default: 'pending',
    },
    stockDecremented: {
      type: Boolean,
      default: false,
    },
    paymentId: String,
    razorpayOrderId: String,
    cashfreeOrderId: String,
    notes: String,
    carrier: String,
    trackingNumber: String,
    trackingLink: String,
    completedAt: Date,
  },
  { timestamps: true }
);

// Indexes for common queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ vendorId: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
