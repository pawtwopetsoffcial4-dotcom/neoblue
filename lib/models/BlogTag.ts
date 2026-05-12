import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogTag extends Document {
  name: string;
  slug: string;
  color: string;
  blogsCount: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogTagSchema = new Schema<IBlogTag>(
  {
    name: {
      type: String,
      required: [true, 'Please provide tag name'],
      trim: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    color: {
      type: String,
      default: '#10B981',
      trim: true,
    },
    blogsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    seoTitle: {
      type: String,
      default: '',
      trim: true,
    },
    seoDescription: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

blogTagSchema.index({ isActive: 1, blogsCount: -1 });

blogTagSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  if (!this.seoTitle) {
    this.seoTitle = this.name;
  }

  if (!this.seoDescription) {
    this.seoDescription = `Posts tagged with ${this.name}`;
  }

  next();
});

export default mongoose.models.BlogTag || mongoose.model<IBlogTag>('BlogTag', blogTagSchema);
