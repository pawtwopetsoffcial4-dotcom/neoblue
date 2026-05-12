import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogCategory extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  blogsCount: number;
  isActive: boolean;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogCategorySchema = new Schema<IBlogCategory>(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name'],
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
    description: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#3B82F6',
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
    displayOrder: {
      type: Number,
      default: 0,
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

blogCategorySchema.index({ isActive: 1, displayOrder: 1 });

blogCategorySchema.pre('save', function (next) {
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
    this.seoDescription = this.description;
  }

  next();
});

export default mongoose.models.BlogCategory || mongoose.model<IBlogCategory>('BlogCategory', blogCategorySchema);
