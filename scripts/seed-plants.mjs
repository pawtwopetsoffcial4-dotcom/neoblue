import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing');
  process.exit(1);
}

const PLANT_PRODUCTS = [
  {
    title: 'Anubias Nana',
    description: 'Anubias Nana is a popular, extremely hardy freshwater aquarium plant. It features beautiful dark green leaves and thick rhizomes. Excellent for anchoring to rocks or driftwood, it is perfect for low-light setups and beginners.',
    price: 250,
  },
  {
    title: 'Java Fern',
    description: 'Java Fern (Microsorum pteropus) is a classic aquatic plant. Known for its tough, narrow green leaves, it is highly adaptable and resistant to herbivorous fish. Must be attached to wood or stone, rather than buried in substrate.',
    price: 180,
  },
  {
    title: 'Amazon Sword',
    description: 'The Amazon Sword (Echinodorus grisebachii/amazonicus) is a stunning centerpiece plant. It develops large, bright green lance-like leaves that form a dense rosette. Requires nutrient-rich substrate and medium lighting to thrive.',
    price: 200,
  },
  {
    title: 'Monte Carlo',
    description: 'Monte Carlo (Micranthemum tweediei) is a highly desired carpeting plant. It creates a lush, vibrant green mat across the aquarium floor. Thrives under moderate-to-high light and CO2 supplementation, but is easier to grow than HC dwarf baby tears.',
    price: 350,
  },
  {
    title: 'Java Moss',
    description: 'Java Moss (Taxiphyllum barbieri) is a versatile and fast-growing moss. It provides excellent shelter for baby shrimp and fry. It can be easily attached to mesh, wood, or rock, and grows well in almost any light condition.',
    price: 150,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Get default vendor
    const vendor = await mongoose.connection.db.collection('users').findOne({ email: 'demovendor@gmail.com' });
    if (!vendor) {
      console.error('Demo vendor (demovendor@gmail.com) not found. Please register/seed vendor first.');
      process.exit(1);
    }
    console.log(`Using vendor: ${vendor.name} (${vendor._id})`);

    // 2. Update StoreConfig categories
    const config = await mongoose.connection.db.collection('storeconfigs').findOne({});
    if (config) {
      const currentCategories = config.categories || [];
      if (!currentCategories.includes('Plants')) {
        const nextCategories = [...currentCategories, 'Plants'];
        await mongoose.connection.db.collection('storeconfigs').updateOne(
          { _id: config._id },
          { $set: { categories: nextCategories } }
        );
        console.log('Added Plants to StoreConfig categories.');
      } else {
        console.log('Plants already in StoreConfig categories.');
      }
    } else {
      // Create empty config with default categories + Plants
      await mongoose.connection.db.collection('storeconfigs').insertOne({
        offerBadge: 'Limited Time Offer',
        offerTitle: 'Save Up To 35% On\\nPremium Aquatic Stock',
        offerDescription: 'Weekend special: handpicked marine and freshwater species, overnight transit care, and live-arrival protection included.',
        offerButtonText: 'Shop The Offer',
        offerButtonLink: '/products',
        categories: ['Guppies', 'Crayfish', 'Kribensis', 'Plants'],
        stat1Value: '500+',
        stat1Label: 'Species Curated',
        stat2Value: '24h',
        stat2Label: 'Priority Dispatch',
        stat3Value: '100%',
        stat3Label: 'Live Arrival Cover',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created StoreConfig with Plants.');
    }

    // 3. Seed Plants Products
    let plantsSeeded = 0;
    for (const item of PLANT_PRODUCTS) {
      const existing = await mongoose.connection.db.collection('products').findOne({
        title: item.title,
        category: 'Plants'
      });

      if (!existing) {
        await mongoose.connection.db.collection('products').insertOne({
          title: item.title,
          description: item.description,
          price: item.price,
          perPiecePrice: item.price,
          images: ['/fishes_cat_cover/Plants.png'],
          category: 'Plants',
          waterType: 'Freshwater',
          vendorId: vendor._id,
          tag: 'Standard',
          rating: 5,
          reviewsCount: 0,
          inStock: true,
          approvalStatus: 'approved',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        plantsSeeded++;
      }
    }
    console.log(`Seeded ${plantsSeeded} plant products.`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
