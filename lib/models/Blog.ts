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
  category: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  featured: boolean;
  isPublished: boolean;
  publishedAt: Date;
  readTime: number;
  views: number;
  commentsCount: number;
  seoTitle: string;
  seoDescription: string;
  seoImage: string;
  metaJson: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Please provide blog title'],
      trim: true,
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
      index: true,
    },
    author: {
      type: String,
      default: 'Neoblue Team',
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'BlogCategory',
      default: null,
    },
    tags: {
      type: [Schema.Types.ObjectId],
      ref: 'BlogTag',
      default: [],
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    readTime: {
      type: Number,
      default: 5,
      min: 1,
    },
    views: {
      type: Number,
      default: 0,
    },
    commentsCount: {
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
    seoImage: {
      type: String,
      default: '',
    },
    metaJson: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound indexes for performance
blogSchema.index({ isPublished: 1, createdAt: -1 });
blogSchema.index({ isPublished: 1, featured: -1, createdAt: -1 });
blogSchema.index({ category: 1, isPublished: 1 });
blogSchema.index({ tags: 1, isPublished: 1 });
blogSchema.index({ title: 'text', excerpt: 'text', content: 'text', keywords: 'text' });

blogSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  if (!this.seoTitle) {
    this.seoTitle = this.title;
  }

  if (!this.seoDescription) {
    this.seoDescription = this.excerpt;
  }

  next();
});

export default mongoose.models.Blog || mongoose.model<IBlog>('Blog', blogSchema);