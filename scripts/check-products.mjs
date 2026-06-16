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
    
    // Find products
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log('Products count:', products.length);
    if (products.length > 0) {
      console.log('Sample product:', JSON.stringify(products.slice(0, 3).map(p => ({ title: p.title, category: p.category, subcategory: p.subcategory })), null, 2));
    }
    
    // Find demo vendor
    const vendors = await mongoose.connection.db.collection('users').find({ role: 'vendor' }).toArray();
    console.log('Vendors count:', vendors.length);
    for (const v of vendors) {
      console.log(`Vendor: ${v.name} (${v.email}) - ID: ${v._id}`);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
