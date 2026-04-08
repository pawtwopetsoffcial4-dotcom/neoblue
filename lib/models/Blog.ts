import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  galleryImages: string[];
  keywords: string[];
  author: string;
  featured: boolean;
  isPublished: boolean;
  readTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Please provide blog title'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Please provide blog excerpt'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide blog content'],
    },
    coverImage: {
      type: String,
      required: [true, 'Please provide a cover image'],
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
    author: {
      type: String,
      default: 'Neoblue Team',
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    readTime: {
      type: Number,
      default: 5,
      min: 1,
    },
  },
  { timestamps: true }
);

blogSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  next();
});

export default mongoose.models.Blog || mongoose.model<IBlog>('Blog', blogSchema);