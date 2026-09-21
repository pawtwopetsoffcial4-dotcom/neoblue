import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEmployee extends Document {
  email: string;
  username?: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const employeeSchema = new Schema<IEmployee>(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    username: {
      type: String,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Drop any legacy non-sparse username index from MongoDB if present
export async function dropLegacyEmployeeIndexes() {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const collection = mongoose.connection.collection('employees');
      const indexes = await collection.indexes();
      for (const idx of indexes) {
        const indexName = idx.name || (idx.key && 'username' in idx.key ? 'username_1' : '');
        if (indexName && (indexName === 'username_1' || (idx.key && 'username' in idx.key))) {
          console.log(`[Employee Model] Dropping legacy index: ${indexName}`);
          await collection.dropIndex(indexName).catch(() => {});
        }
      }
    }
  } catch {
    // Suppress if collection doesn't exist yet
  }
}

employeeSchema.pre('save', async function (next) {
  if (!this.username && this.email) {
    this.username = this.email.toLowerCase();
  }

  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

employeeSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', employeeSchema);

