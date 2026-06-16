import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing');
  process.exit(1);
}

async function unseed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Keep only the original products
    const result = await mongoose.connection.db.collection('products').deleteMany({
      title: { $nin: ['Blue panda big ear', 'Golden guppies'] }
    });

    console.log(`Deleted ${result.deletedCount} seeded products from the catalog.`);
  } catch (err) {
    console.error('Unseed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

unseed();
