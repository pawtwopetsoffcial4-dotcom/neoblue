import mongoose, { Schema, Document } from 'mongoose';

export interface IFishDescription extends Document {
  name: string;
  description: string;
}

const fishDescriptionSchema = new Schema<IFishDescription>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.FishDescription || mongoose.model<IFishDescription>('FishDescription', fishDescriptionSchema);
