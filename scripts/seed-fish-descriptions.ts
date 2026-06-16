// @ts-nocheck
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { PRODUCT_CATALOG, FISH_NAMES } from '../lib/catalog';
import FishDescription from '../lib/models/FishDescription';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI_DIRECT or MONGODB_URI is missing in .env.local');
  process.exit(1);
}

// Generate basic descriptions based on the fish category and name
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

async function seedFishDescriptions() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const descriptionsToSeed = [];

    for (const [category, names] of Object.entries(PRODUCT_CATALOG)) {
      for (const name of names) {
        descriptionsToSeed.push({
          name,
          description: generateDescription(category, name),
        });
      }
    }

    let updatedCount = 0;
    let insertedCount = 0;

    for (const data of descriptionsToSeed) {
      const result = await FishDescription.findOneAndUpdate(
        { name: data.name },
        { $set: { description: data.description } },
        { upsert: true, new: true }
      );
      if (result) {
        updatedCount++;
      } else {
        insertedCount++;
      }
    }

    console.log(`Seeded ${updatedCount + insertedCount} fish descriptions successfully.`);
  } catch (error) {
    console.error('Failed to seed fish descriptions:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedFishDescriptions();
