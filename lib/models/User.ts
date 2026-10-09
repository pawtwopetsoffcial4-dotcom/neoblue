import mongoose, { Schema, Document } from 'mongoose';
import { hashPassword, verifyPassword } from '@/lib/utils/password';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  password: string;
  slug?: string;
  role: 'user' | 'vendor' | 'admin' | 'employee';
  addresses: Array<{
    street: string;
    city: string;
    state: string;
    zipcode: string;
    isDefault: boolean;
  }>;
  isApproved: boolean; // for vendors
  shippingRatesSouth?: {
    slab500g: number;
    slab1kg: number;
    slab2kg: number;
    slab3kg: number;
    slab5kg: number;
    slab10kg: number;
  };
  shippingRatesNorth?: {
    slab500g: number;
    slab1kg: number;
    slab2kg: number;
    slab3kg: number;
    slab5kg: number;
    slab10kg: number;
  };
  nonServiceableStates?: string[];
  deliverNorth?: boolean;
  deliverSouth?: boolean;
  createdAt: Date;
  updatedat: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'vendor', 'admin', 'employee'],
      default: 'user',
    },
    addresses: [
      {
        street: String,
        city: String,
        state: String,
        zipcode: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    isApproved: {
      type: Boolean,
      default: false,
    },
    shippingRatesSouth: {
      slab500g: { type: Number, default: 0 },
      slab1kg: { type: Number, default: 0 },
      slab2kg: { type: Number, default: 0 },
      slab3kg: { type: Number, default: 0 },
      slab5kg: { type: Number, default: 0 },
      slab10kg: { type: Number, default: 0 },
    },
    shippingRatesNorth: {
      slab500g: { type: Number, default: 0 },
      slab1kg: { type: Number, default: 0 },
      slab2kg: { type: Number, default: 0 },
      slab3kg: { type: Number, default: 0 },
      slab5kg: { type: Number, default: 0 },
      slab10kg: { type: Number, default: 0 },
    },
    nonServiceableStates: {
      type: [String],
      default: [],
    },
    deliverNorth: {
      type: Boolean,
      default: true,
    },
    deliverSouth: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (password: string) {
  return await verifyPassword(password, this.password, this.email);
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
