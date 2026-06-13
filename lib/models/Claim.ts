import mongoose, { Schema, Document } from 'mongoose';

export interface IClaim extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  products: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
    reason: string;
  }>;
  proofUrls: string[];
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  resolution?: 'refund' | 'replacement';
  refundAmount?: number;
  replacementOrderId?: mongoose.Types.ObjectId;
  vendorNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const claimSchema = new Schema<IClaim>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
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
        reason: {
          type: String,
          required: true,
        },
      },
    ],
    proofUrls: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: 'At least one proof unboxing video is required.',
      },
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    resolution: {
      type: String,
      enum: ['refund', 'replacement'],
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    replacementOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    vendorNotes: String,
  },
  { timestamps: true }
);

export default mongoose.models.Claim || mongoose.model<IClaim>('Claim', claimSchema);
