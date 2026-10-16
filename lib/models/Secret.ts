import mongoose, { Schema, Document } from 'mongoose';

export interface ISecret extends Document {
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const secretSchema = new Schema<ISecret>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Secret || mongoose.model<ISecret>('Secret', secretSchema);
