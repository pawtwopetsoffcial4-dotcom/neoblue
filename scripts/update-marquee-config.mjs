import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix Node.js DNS resolution for MongoDB SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback
}

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing in .env.local');
  process.exit(1);
}

const StoreConfigSchema = new mongoose.Schema(
  {
    marqueeText: { type: String, default: 'Next shipping on Monday! Order fast for fastest delivery.' },
    marqueeEnabled: { type: Boolean, default: true },
    marqueeLink: { type: String, default: '/products' },
  },
  { strict: false, timestamps: true }
);

const StoreConfig = mongoose.models.StoreConfig || mongoose.model('StoreConfig', StoreConfigSchema);

async function updateMarquee() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const updated = await StoreConfig.findOneAndUpdate(
      {},
      {
        $set: {
          marqueeText: 'Next shipping on Monday! Order fast for fastest delivery.',
          marqueeEnabled: true,
          marqueeLink: '/products',
        }
      },
      { new: true, upsert: true }
    );

    console.log('✓ StoreConfig marquee updated:', {
      marqueeText: updated.marqueeText,
      marqueeEnabled: updated.marqueeEnabled,
      marqueeLink: updated.marqueeLink,
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error updating marquee config:', error);
    process.exit(1);
  }
}

updateMarquee();
