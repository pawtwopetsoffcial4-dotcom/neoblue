import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogAnalytics extends Document {
  blogId: mongoose.Types.ObjectId;
  date: Date;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  comments: number;
  shares: number;
  likes: number;
  referrers: { source: string; count: number }[];
  devices: { device: string; count: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const blogAnalyticsSchema = new Schema<IBlogAnalytics>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
      default: () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
      },
    },
    views: {
      type: Number,
      default: 0,
    },
    uniqueViews: {
      type: Number,
      default: 0,
    },
    avgTimeOnPage: {
      type: Number,
      default: 0,
    },
    bounceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    referrers: [
      {
        source: String,
        count: Number,
      },
    ],
    devices: [
      {
        device: String,
        count: Number,
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes for analytics queries
blogAnalyticsSchema.index({ blogId: 1, date: -1 });

export default mongoose.models.BlogAnalytics || mongoose.model<IBlogAnalytics>('BlogAnalytics', blogAnalyticsSchema);
