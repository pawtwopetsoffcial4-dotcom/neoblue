import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing in .env.local');
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'vendor', 'admin'], default: 'user' },
    addresses: [
      {
        street: String,
        city: String,
        state: String,
        zipcode: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

const ADMIN_EMAIL = 'demoadmin@gmail.com';
const ADMIN_PASSWORD = 'demoadminpass';

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const passBytes = enc.encode(password);
  const combined = new Uint8Array(salt.length + passBytes.length);
  combined.set(salt, 0);
  combined.set(passBytes, salt.length);
  const digest = await crypto.subtle.digest('SHA-256', combined);
  return `sha256:${bytesToHex(salt)}:${bytesToHex(new Uint8Array(digest))}`;
}

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);

    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    const updatedAdmin = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $set: {
          name: 'Demo Admin',
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin',
          isApproved: true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log('Admin seeded successfully');
    console.log(`Email: ${updatedAdmin.email}`);
    console.log('Password: demoadminpass');
    console.log(`Role: ${updatedAdmin.role}`);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
