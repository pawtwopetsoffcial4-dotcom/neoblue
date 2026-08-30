/**
 * Algorithmic Product Ranking System for NeoBlue E-Commerce
 * 
 * Automatically calculates dynamic ranking scores for:
 * 1. Trending Now (Velocity Score: Sales + Rating + Reviews + Discount + Recency + Category Diversity)
 * 2. New Arrivals (Freshness: Creation Date + Availability + Diversity)
 * 3. Best Sellers (Volume: Sales Volume + Rating Score)
 */

export interface ProductRankable {
  _id?: string;
  id?: string;
  title: string;
  price: number;
  rating?: number;
  reviewsCount?: number;
  soldQuantity?: number;
  discountPercentage?: number;
  originalPrice?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  isTrending?: boolean;
  isNewArrival?: boolean;
  category?: string;
  subcategory?: string;
  inStock?: boolean;
  images?: string[];
  [key: string]: any;
}

/**
 * Calculates a dynamic Trending Velocity Score (0 - 1000+)
 */
export function calculateTrendingScore(product: ProductRankable): number {
  let score = 0;

  // 1. Manual Admin Override Bonus (If pinned by admin, guarantee top presence)
  if (product.isTrending) {
    score += 500;
  }

  // 2. Sales Volume Weight (Each unit sold adds high momentum)
  const sales = Number(product.soldQuantity) || 0;
  score += sales * 20;

  // 3. Social Proof & Rating Score
  const rating = Number(product.rating) || 4.5;
  const reviews = Number(product.reviewsCount) || 1;
  // Weighted rating logarithmic formula: rating * log2(1 + reviews)
  score += rating * Math.log2(1 + reviews) * 12;

  // 4. Value / Discount Momentum (Attractive deals convert higher)
  const discount = Number(product.discountPercentage) || 0;
  if (discount > 0) {
    score += Math.min(30, discount * 0.8);
  }

  // 5. Freshness / Recency Decay
  if (product.createdAt) {
    const createdTime = new Date(product.createdAt).getTime();
    const now = Date.now();
    const ageInDays = Math.max(0, (now - createdTime) / (1000 * 60 * 60 * 24));
    
    // Freshness bonus for items within 45 days
    if (ageInDays <= 45) {
      score += (45 - ageInDays) * 0.6;
    }
  }

  // 6. Media Quality Bonus
  if (Array.isArray(product.images) && product.images.length > 1) {
    score += 5;
  }

  return score;
}

/**
 * Automatically computes and returns top Trending products.
 * Includes subcategory interleaving / diversity to avoid showing 8 of the same species.
 */
export function getTrendingProducts<T extends ProductRankable>(
  products: T[],
  limit = 10,
  enableDiversity = true
): T[] {
  if (!products || products.length === 0) return [];

  // Filter in-stock products
  const candidates = products.filter((p) => p.inStock !== false);

  // Compute scores and sort descending
  const scored = candidates
    .map((product) => ({
      product,
      score: calculateTrendingScore(product),
    }))
    .sort((a, b) => b.score - a.score);

  if (!enableDiversity) {
    return scored.slice(0, limit).map((s) => s.product);
  }

  // Category & subcategory diversity algorithm
  const selected: T[] = [];
  const categoryCounts = new Map<string, number>();
  const subcategoryCounts = new Map<string, number>();

  // Pass 1: Pick diverse items (Max 3 per category, Max 2 per subcategory)
  for (const item of scored) {
    if (selected.length >= limit) break;

    const cat = (item.product.category || 'general').toLowerCase();
    const subcat = (item.product.subcategory || item.product.title.split(' ')[0] || 'default').toLowerCase();

    const currentCatCount = categoryCounts.get(cat) || 0;
    const currentSubcatCount = subcategoryCounts.get(subcat) || 0;

    if (currentCatCount < 3 && currentSubcatCount < 2) {
      selected.push(item.product);
      categoryCounts.set(cat, currentCatCount + 1);
      subcategoryCounts.set(subcat, currentSubcatCount + 1);
    }
  }

  // Pass 2: If limit not reached, backfill from remaining top-scoring items
  if (selected.length < limit) {
    const selectedIds = new Set(selected.map((p) => p._id || p.id));
    for (const item of scored) {
      if (selected.length >= limit) break;
      const id = item.product._id || item.product.id;
      if (id && !selectedIds.has(id)) {
        selected.push(item.product);
        selectedIds.add(id);
      }
    }
  }

  return selected;
}

/**
 * Automatically computes and returns top New Arrival products.
 * Ranks by creation recency with category diversity.
 */
export function getNewArrivalProducts<T extends ProductRankable>(
  products: T[],
  limit = 10
): T[] {
  if (!products || products.length === 0) return [];

  // Filter in-stock products
  const candidates = products.filter((p) => p.inStock !== false);

  // Sort by createdAt descending (with isNewArrival manual override bump)
  const sorted = [...candidates].sort((a, b) => {
    if (a.isNewArrival && !b.isNewArrival) return -1;
    if (!a.isNewArrival && b.isNewArrival) return 1;

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Interleave different species to prevent a single species batch from dominating
  const selected: T[] = [];
  const subcategoryCounts = new Map<string, number>();

  // Pass 1: Diverse recent items (Max 2 per subcategory)
  for (const product of sorted) {
    if (selected.length >= limit) break;
    const subcat = (product.subcategory || product.title.split(' ')[0] || 'default').toLowerCase();
    const count = subcategoryCounts.get(subcat) || 0;

    if (count < 2) {
      selected.push(product);
      subcategoryCounts.set(subcat, count + 1);
    }
  }

  // Pass 2: Backfill if needed
  if (selected.length < limit) {
    const selectedIds = new Set(selected.map((p) => p._id || p.id));
    for (const product of sorted) {
      if (selected.length >= limit) break;
      const id = product._id || product.id;
      if (id && !selectedIds.has(id)) {
        selected.push(product);
        selectedIds.add(id);
      }
    }
  }

  return selected;
}
