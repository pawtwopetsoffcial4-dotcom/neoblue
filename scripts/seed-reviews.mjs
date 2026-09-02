import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix Node.js DNS resolution for MongoDB SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback to default
}

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing in .env.local');
  process.exit(1);
}

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
    },
    verified: {
      type: Boolean,
      default: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
  },
  { strict: false }
);

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const INDIAN_NAMES = [
  'Aarav Sharma', 'Rohan Mehta', 'Aditi Verma', 'Vikram Rao', 'Sneha Iyer',
  'Pooja Nair', 'Kunal Deshmukh', 'Ananya Gupta', 'Rahul Banerjee', 'Siddharth Patel',
  'Meera Krishnan', 'Arjun Kulkarni', 'Tanvi Sengupta', 'Deepak Hegde', 'Divya Reddy',
  'Nikhil Joshi', 'Shweta Choudhury', 'Varun Menon', 'Priya Swaminathan', 'Amitabh Roy',
  'Karthik Sundaram', 'Neha Kapoor', 'Sanjay Bhatt', 'Ritika Malhotra', 'Harish Nambiar',
  'Suresh Pillai', 'Manoj Kumar', 'Gaurav Jain', 'Kavita Pillai', 'Prashant Das',
  'Abhishek Mukherjee', 'Preeti Nair', 'Anand Kulkarni', 'Geeta Ranganathan', 'Rajesh Nair'
];

const FISH_REVIEWS = [
  { rating: 5, comment: 'Arrived in perfect health! The thermo-insulated packaging with oxygen was outstanding. They started swimming actively within 30 minutes of drip acclimation.' },
  { rating: 5, comment: 'Stunning coloration and very lively. Exactly as shown in the pictures. Eating flakes and micro-pellets with great appetite!' },
  { rating: 5, comment: 'Super safe express delivery to Bangalore. All specimens survived and colored up vibrantly after lights went on.' },
  { rating: 4, comment: 'Healthy and active fish. Took about a day to fully settle in, but now schooling together happily in my planted tank.' },
  { rating: 5, comment: 'Top quality live arrival! You can tell the nursery takes proper care of quarantine and health before shipping.' },
  { rating: 5, comment: 'Fins are completely clean and unbroken. Zero signs of stress or sickness. 100% satisfied customer!' },
  { rating: 5, comment: 'One of the best live fish ordering experiences in India. Excellent communication and prompt dispatch.' },
  { rating: 4, comment: 'Beautiful specimen with great finnage and active temperament. Loving the peaceful addition to my community aquarium.' },
  { rating: 5, comment: 'Packaging was 10/10. Styrofoam box with seasonal packs kept water temperature perfect during transit.' },
  { rating: 5, comment: 'Very healthy, responsive, and energetic. They immediately recognized feeding time on day one!' }
];

const PLANT_REVIEWS = [
  { rating: 5, comment: 'Super fresh, lush green stems with zero melting or snails! Root system was very well-developed.' },
  { rating: 5, comment: 'Pristine tissue culture quality. Clean, pest-free, and easy to divide into multiple foreground bunches.' },
  { rating: 5, comment: 'Arrived moist and healthy inside sealed packaging. Started throwing new submersed leaves within a week!' },
  { rating: 4, comment: 'Generous portion size. Melted slightly during initial conversion as expected, but rebounding nicely now.' },
  { rating: 5, comment: 'Gorgeous plant! Vibrant coloration and very healthy leaves. Fits right into my high-tech Dutch scape.' },
  { rating: 5, comment: 'Zero algae, zero hitchhikers. Shipped fast with great care. Will definitely purchase more aquarium plants from here.' },
  { rating: 4, comment: 'Healthy roots and green foliage. Planted into aqua soil and roots anchored in quickly.' },
  { rating: 5, comment: 'Excellent quality aquatic flora. Packed with wet sponge protection so leaves stayed hydrated.' }
];

const SHRIMP_REVIEWS = [
  { rating: 5, comment: 'Very active little clean-up crew! Zero casualties during express transit. Shipped with mesh for them to hold onto.' },
  { rating: 5, comment: 'Solid color grade with high opacity. Acclimated with drip method over 2 hours and they are thriving.' },
  { rating: 5, comment: 'Constantly grazing on biofilm and algae. Super healthy and energetic shrimps!' },
  { rating: 4, comment: 'Great size and color. One was even berried with eggs! Highly recommend for planted nano tanks.' },
  { rating: 5, comment: 'Secure breathable packaging with insulated walls. Arrived warm and energetic even in monsoon.' }
];

const ACCESSORY_REVIEWS = [
  { rating: 5, comment: 'High build quality and precise finish. Works seamlessly with standard aquarium tubing and glassware.' },
  { rating: 5, comment: 'Genuine product delivered safely. Essential tool for regular planted tank maintenance and scaping.' },
  { rating: 4, comment: 'Very reliable and sturdy material. Makes aquarium upkeep so much easier and faster.' },
  { rating: 5, comment: 'Great value for money. Highly recommended for all hobbyists.' }
];

function getRandomDateWithinMonths(months = 6) {
  const now = new Date();
  const past = new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function seedBotReviews() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to populate with reviews.`);

    let totalReviewsAdded = 0;

    for (const product of products) {
      const category = (product.category || '').toLowerCase();
      const title = (product.title || '').toLowerCase();

      let reviewPool = FISH_REVIEWS;
      if (category.includes('plant') || title.includes('anubias') || title.includes('fern') || title.includes('moss') || title.includes('rotala') || title.includes('crypt')) {
        reviewPool = PLANT_REVIEWS;
      } else if (category.includes('shrimp') || category.includes('snail') || title.includes('shrimp') || title.includes('snail') || title.includes('cleaner')) {
        reviewPool = SHRIMP_REVIEWS;
      } else if (category.includes('accessories') || category.includes('food') || category.includes('fertilizer') || category.includes('co2')) {
        reviewPool = ACCESSORY_REVIEWS;
      }

      // Check existing reviews
      const existingReviews = await Review.find({ productId: product._id });
      const neededCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 reviews per product

      if (existingReviews.length >= neededCount) {
        console.log(`Product "${product.title}" already has ${existingReviews.length} reviews. Updating stats...`);
        const ratingSum = existingReviews.reduce((sum, r) => sum + r.rating, 0);
        const avg = ratingSum / existingReviews.length;
        await Product.findByIdAndUpdate(product._id, {
          rating: Math.round(avg * 10) / 10,
          reviewsCount: existingReviews.length,
        });
        continue;
      }

      const countToAdd = neededCount - existingReviews.length;
      const shuffledUsers = shuffle(INDIAN_NAMES);
      const shuffledReviews = shuffle(reviewPool);

      const newReviewsToInsert = [];
      for (let i = 0; i < countToAdd; i++) {
        const user = shuffledUsers[i % shuffledUsers.length];
        const template = shuffledReviews[i % shuffledReviews.length];
        const reviewDate = getRandomDateWithinMonths(4);

        newReviewsToInsert.push({
          productId: product._id,
          user,
          rating: template.rating,
          comment: template.comment,
          verified: true,
          avatar: user.charAt(0).toUpperCase(),
          date: reviewDate,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        });
      }

      await Review.insertMany(newReviewsToInsert);
      totalReviewsAdded += newReviewsToInsert.length;

      // Recalculate average rating & reviewsCount
      const allProductReviews = await Review.find({ productId: product._id });
      const ratingSum = allProductReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = allProductReviews.length > 0 ? (ratingSum / allProductReviews.length) : 5.0;

      await Product.findByIdAndUpdate(product._id, {
        rating: Math.round(averageRating * 10) / 10,
        reviewsCount: allProductReviews.length,
      });

      console.log(`✓ Added ${newReviewsToInsert.length} reviews to "${product.title}" (Total: ${allProductReviews.length}, Rating: ${(Math.round(averageRating * 10) / 10).toFixed(1)}★)`);
    }

    console.log(`\n🎉 Successfully added ${totalReviewsAdded} verified reviews across ${products.length} products!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding bot reviews:', error);
    process.exit(1);
  }
}

seedBotReviews();
