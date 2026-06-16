// @ts-nocheck
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { PRODUCT_CATALOG } from '../lib/catalog';
import Product from '../lib/models/Product';
import FishDescription from '../lib/models/FishDescription';
import User from '../lib/models/User';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing');
  process.exit(1);
}

// Map categories to beautiful stock images
const STOCK_IMAGES = {
  Guppies: 'https://images.unsplash.com/photo-1534080391025-a77c4e77243c?w=600&auto=format&fit=crop&q=80',
  Crayfish: 'https://images.unsplash.com/photo-1618482623956-6a589cf8b006?w=600&auto=format&fit=crop&q=80',
  'Jewel Cichlid': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
  'Ram Cichlid': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=80',
  Kribensis: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a02?w=600&auto=format&fit=crop&q=80',
  Apistogramma: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80',
};

const generateDescription = (category: string, name: string) => {
  if (category === 'Guppies') {
    return `The ${name} is a beautiful and active guppy variant, known for its vibrant colors and striking patterns. Perfect for freshwater aquariums, this fish is hardy and relatively easy to care for, making it ideal for both beginners and experienced aquarists.`;
  }
  if (category === 'Crayfish') {
    return `The ${name} is a fascinating bottom-dweller that adds a unique dynamic to any freshwater tank. With its vibrant exoskeleton and active scavenging behavior, it is an excellent choice for a well-structured aquarium with plenty of hiding spots.`;
  }
  if (category === 'Kribensis') {
    return `The ${name} is a colorful and relatively peaceful dwarf cichlid. Known for their intriguing breeding behavior and stunning breeding dress, they are a fantastic addition to a community tank with appropriately sized tank mates.`;
  }
  if (category === 'Jewel Cichlid') {
    return `The ${name} is a highly territorial, remarkably colorful African cichlid. Known for its brilliant coloration, especially during breeding, it makes a stunning center-piece for cichlid-focused setups with adequate rocky formations and hiding places.`;
  }
  if (category === 'Ram Cichlid') {
    return `The ${name} is a popular dwarf cichlid prized for its peaceful nature and spectacular iridescent colors. They thrive in well-planted community tanks with warm, soft, and clean water conditions.`;
  }
  if (category === 'Apistogramma') {
    return `The ${name} is a gorgeous South American dwarf cichlid, highly sought-after for its elaborate finnage and fascinating harem-spawning behaviors. It prefers soft, slightly acidic water and a tank rich with leaf litter and caves.`;
  }
  return `The ${name} is a wonderful addition to any aquarium, bringing life and activity to your aquatic setup. Ensure proper water conditions and diet for optimal health and vibrant colors.`;
};

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Get default vendor
    const vendor = await User.findOne({ email: 'demovendor@gmail.com' });
    if (!vendor) {
      console.error('Demo vendor (demovendor@gmail.com) not found. Please register/seed vendor first.');
      process.exit(1);
    }
    console.log(`Using vendor: ${vendor.name} (${vendor._id})`);

    // 2. Iterate and seed
    let descriptionsSeeded = 0;
    let productsSeeded = 0;

    for (const [category, names] of Object.entries(PRODUCT_CATALOG)) {
      for (const name of names) {
        // A. Seed description
        const descText = generateDescription(category, name);
        await FishDescription.findOneAndUpdate(
          { name },
          { $set: { name, description: descText } },
          { upsert: true, new: true }
        );
        descriptionsSeeded++;

        // B. Seed product
        const existingProduct = await Product.findOne({
          title: name,
          category: category
        });

        if (!existingProduct) {
          // Calculate random price between 150 and 650 INR (multiples of 50)
          const price = 150 + Math.floor(Math.random() * 11) * 50;
          const image = STOCK_IMAGES[category] || STOCK_IMAGES.Guppies;

          await Product.create({
            title: name,
            description: descText,
            price,
            perPiecePrice: price,
            images: [image],
            category,
            waterType: 'Freshwater',
            vendorId: vendor._id,
            tag: 'Standard',
            rating: 5,
            reviewsCount: 0,
            inStock: true,
            approvalStatus: 'approved'
          });
          productsSeeded++;
        }
      }
    }

    console.log(`Descriptions seeded/synced: ${descriptionsSeeded}`);
    console.log(`Products seeded: ${productsSeeded}`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
