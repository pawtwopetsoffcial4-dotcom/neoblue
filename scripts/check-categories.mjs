import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // 1. Get StoreConfig categories
    const config = await mongoose.connection.db.collection('storeconfigs').findOne({});
    console.log('StoreConfig categories:', config?.categories);

    // 2. Get distinct product categories
    const productCategories = await mongoose.connection.db.collection('products').distinct('category');
    console.log('Product distinct categories:', productCategories);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
