import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogComment extends Document {
  blogId: mongoose.Types.ObjectId;
  author: string;
  email: string;
  content: string;
  rating: number;
  isApproved: boolean;
  replies: IBlogComment[];
  parentId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const blogCommentSchema = new Schema<IBlogComment>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
      index: true,
    },
    author: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    content: {
      type: String,
      required: [true, 'Please provide comment content'],
      trim: true,
      minlength: [3, 'Comment must be at least 3 characters'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'BlogComment',
      default: null,
    },
    replies: {
      type: [{ type: Schema.Types.ObjectId, ref: 'BlogComment' }],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for performance
blogCommentSchema.index({ blogId: 1, isApproved: 1, createdAt: -1 });
blogCommentSchema.index({ parentId: 1 });

export default mongoose.models.BlogComment || mongoose.model<IBlogComment>('BlogComment', blogCommentSchema);
