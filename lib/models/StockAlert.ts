import mongoose, { Schema, Document } from 'mongoose';

export interface IStockAlert extends Document {
  email?: string;
  phone?: string;
  productId: mongoose.Types.ObjectId;
  productTitle?: string;
  status: 'pending' | 'notified';
  createdAt: Date;
  updatedAt: Date;
}

const StockAlertSchema = new Schema<IStockAlert>(
  {
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productTitle: { type: String },
    status: { type: String, enum: ['pending', 'notified'], default: 'pending' },
  },
  { timestamps: true }
);

StockAlertSchema.index({ productId: 1, email: 1, phone: 1 });

export default mongoose.models.StockAlert || mongoose.model<IStockAlert>('StockAlert', StockAlertSchema);
