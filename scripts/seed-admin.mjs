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

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

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
