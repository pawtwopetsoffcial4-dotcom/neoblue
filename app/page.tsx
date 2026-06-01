"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Waves, Sparkles, Droplets, Package, Fish,
  Search, Home, ShoppingBag, User, ArrowRight
} from 'lucide-react';
import ReviewStars from '@/app/components/ReviewStars';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

/* ------------------------------------------------------------------ */
/* LIVE DATA HELPERS                                                   */
/* ------------------------------------------------------------------ */
type HeroCardProduct = {
  id: string;
  title: string;
  price: number;
  img: string;
  tag?: string;
  rating?: number;
  createdAt?: string;
};

const DEFAULT_IMAGE = 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg';

const extractProducts = (payload: unknown): MarketplaceProduct[] => {
  if (Array.isArray(payload)) {
    return payload as MarketplaceProduct[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const data = payload as {
    products?: unknown;
    data?: {
      products?: unknown;
    };
  };

  if (Array.isArray(data.products)) {
    return data.products as MarketplaceProduct[];
  }

  if (Array.isArray(data.data?.products)) {
    return data.data.products as MarketplaceProduct[];
  }

  return [];
};

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Guppies: Fish,
  Crayfish: Droplets,
  Kribensis: Sparkles,
  Betta: Sparkles,
  "Angel's": Waves,
  Discuss: Waves,
  Platy: Fish,
  'Exotic Molly': Fish,
  Zebra: Fish,
};

const categorySlugMap: Record<string, string> = {
  Guppies: 'guppies',
  Crayfish: 'crayfish',
  Kribensis: 'kribensis',
  Betta: 'betta',
  "Angel's": 'angels',
  Discuss: 'discuss',
  Platy: 'platy',
  'Exotic Molly': 'exotic-molly',
  Zebra: 'zebra',
};

const toCategorySlug = (category: string) =>
  categorySlugMap[category] || category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ------------------------------------------------------------------ */
/* NATIVE-FEEL HORIZONTAL SCROLL HELPER                               */
/* ------------------------------------------------------------------ */
function MobileScrollSection({ title, children }: { title: string; children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="pt-6 pb-2 bg-white">
      <div className="px-5 mb-4 flex justify-between items-end">
        <h2 className="text-xl font-bold tracking-tight text-blue-950">{title}</h2>
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">See All</span>
      </div>
      {/* Hide scrollbar, force snap for app-like feel */}
      <div 
        ref={scrollRef} 
        className="flex overflow-x-auto gap-4 px-5 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ULTRA-CLEAN PRODUCT CARD                                           */
/* ------------------------------------------------------------------ */
function MobileCard({ product }: { product: any }) {
  const reviewCount = product.reviewCount ?? ((product.title?.length ?? 6) * 7 + 12);
  return (
    <Link
      href={`/products/${product.id}`}
      className="group w-40 md:w-55 shrink-0 snap-start flex flex-col rounded-2xl overflow-hidden border border-blue-50/50 bg-white shadow-[0_4px_20px_-10px_rgba(37,99,235,0.1)]"
    >
        <div className="relative aspect-square bg-blue-50/30 overflow-hidden">
        <img
          src={product.img}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {product.tag && String(product.tag).toLowerCase() !== 'standard' ? (
          <div className="absolute left-2 top-2 rounded-md px-2 py-1 pill-neoblue-gradient text-white text-xs font-bold">
            {product.tag}
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-blue-950 truncate mb-1">{product.title}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black text-blue-600">₹{product.price}</p>
          <div className="flex items-center gap-2">
            <ReviewStars rating={Number(product.rating) || 0} count={Math.max(1, Math.floor(reviewCount))} compact />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ================================================================== */
/* MAIN PAGE                                                          */
/* ================================================================== */
export default function NeoBlueMobileOptimized() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categoriesFromDb, setCategoriesFromDb] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setIsLoading(true);

        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/products?limit=24', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ]);

        if (!productsResponse.ok) {
          throw new Error('Failed to load homepage products');
        }

        const productsData = await productsResponse.json();
        const liveProducts = extractProducts(productsData).filter((product) => {
          const isApproved = (product.approvalStatus ?? 'approved') === 'approved';
          return isApproved && product.inStock;
        });

        setProducts(liveProducts);

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          const dbCategories: unknown[] = Array.isArray(categoriesData?.categories) ? categoriesData.categories : [];
          setCategoriesFromDb(dbCategories.filter((category): category is string => typeof category === 'string'));
        } else {
          setCategoriesFromDb([]);
        }
      } catch {
        setProducts([]);
        setCategoriesFromDb([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  const cards = useMemo<HeroCardProduct[]>(
    () =>
      products.map((product) => ({
        id: product._id,
        title: product.title,
        price: product.price,
        img: product.images?.[0] || DEFAULT_IMAGE,
        tag: product.tag,
        rating: product.rating,
        createdAt: product.createdAt,
      })),
    [products]
  );

  const trendingProducts = useMemo(
    () => [...cards].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)).slice(0, 8),
    [cards]
  );

  const newArrivalProducts = useMemo(
    () =>
      [...cards]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 8),
    [cards]
  );

  const categories = useMemo(() => {
    const liveCategories = Array.from(new Set(products.map((product) => product.category)));
    const mergedCategories = Array.from(new Set([...categoriesFromDb, ...liveCategories]));

    return mergedCategories.sort().slice(0, 8).map((label) => ({
      label,
      icon: categoryIconMap[label] || Package,
    }));
  }, [categoriesFromDb, products]);

  return (
    <div className="min-h-screen bg-white text-blue-950 font-sans pb-20 md:pb-0 selection:bg-blue-100">

      {/* 2. AD BANNER (Hero) - Blue & White strictly */}
      <section className="px-4 pt-4 pb-2 bg-white">
        <div className="relative w-full rounded-3xl bg-blue-600 overflow-hidden shadow-sm flex flex-col justify-center p-6 min-h-55">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          
          <div className="relative z-10">
            {/* hero capsule removed */}
            <h1 className="text-2xl font-black text-white leading-tight mb-2">
              Save 35% on All<br/>Premium Stock
            </h1>
            <p className="text-blue-100 text-xs mb-5 font-light max-w-[80%]">
              {isLoading
                ? 'Loading live inventory...'
                : `Live arrival guaranteed across ${products.length} in-stock fish and aquatic listings.`}
            </p>
            <button className="h-10 px-5 rounded-full bg-white text-blue-700 text-xs font-bold uppercase tracking-wider inline-flex items-center w-fit shadow-sm">
              Claim Deal <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES (Circular Scroll) */}
      <section className="pt-6 pb-2 bg-white">
        <div className="flex overflow-x-auto gap-5 px-5 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={i}
                href={`/categories/${toCategorySlug(cat.label)}`}
                className="flex flex-col items-center gap-2 shrink-0 snap-start"
              >
                <div className="h-16 w-16 rounded-full border border-blue-100 bg-white shadow-sm flex items-center justify-center text-blue-600">
                  <Icon className="h-6 w-6 stroke-[1.5]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900/70">{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. TRENDING */}
      <MobileScrollSection title="Trending">
        {trendingProducts.map((product) => (
          <MobileCard key={`trend-${product.id}`} product={product} />
        ))}
        {!isLoading && trendingProducts.length === 0 ? (
          <div className="w-full rounded-2xl border border-dashed border-blue-100 p-4 text-xs text-blue-600">
            No live products available right now.
          </div>
        ) : null}
      </MobileScrollSection>

      {/* 5. NEW ARRIVALS */}
      <MobileScrollSection title="New Arrivals">
        {newArrivalProducts.map((product) => (
          <MobileCard key={`new-${product.id}`} product={product} />
        ))}
        {!isLoading && newArrivalProducts.length === 0 ? (
          <div className="w-full rounded-2xl border border-dashed border-blue-100 p-4 text-xs text-blue-600">
            New arrivals will appear as soon as products are published.
          </div>
        ) : null}
      </MobileScrollSection>

      {/* 6. BOTTOM NAVIGATION BAR (Mobile Only - Based on the 4 blocks sketch) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-blue-50 px-6 py-3 pb-safe">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex flex-col items-center gap-1 text-blue-600">
            <Home className="h-5 w-5" fill="currentColor" />
            <span className="text-[9px] font-bold">Home</span>
          </Link>
          <Link href="/categories" className="flex flex-col items-center gap-1 text-blue-300 hover:text-blue-600 transition-colors">
            <Search className="h-5 w-5" />
            <span className="text-[9px] font-bold">Browse</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center gap-1 text-blue-300 hover:text-blue-600 transition-colors relative">
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-600 border-2 border-white" />
            <ShoppingBag className="h-5 w-5" />
            <span className="text-[9px] font-bold">Cart</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 text-blue-300 hover:text-blue-600 transition-colors">
            <User className="h-5 w-5" />
            <span className="text-[9px] font-bold">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Basic spacing for desktop footer to avoid breaking if viewed on large screen */}
      <div className="hidden md:block py-10 text-center text-xs text-blue-300">
        Desktop Footer Hidden for Mobile Wireframe Demo
      </div>
    </div>
  );
}