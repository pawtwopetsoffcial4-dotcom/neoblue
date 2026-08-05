"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Waves, Sparkles, Droplets, Package, Fish, Leaf,
  Search, Home, ShoppingBag, User, ArrowRight
} from 'lucide-react';
import ReviewStars from '@/app/components/ReviewStars';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { PRODUCT_CATEGORIES, getCategoryImage } from '@/lib/catalog';
import { useMode } from '@/lib/hooks/useMode';
import ProductCard from '@/app/components/ProductCard';


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
  reviewsCount?: number;
  createdAt?: string;
  isTrending?: boolean;
  isNewArrival?: boolean;
  category: string;
  perPairPrice?: number;
  perPiecePrice?: number;
  inStock?: boolean;
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

const toCategorySlug = (category: string) =>
  category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ------------------------------------------------------------------ */
/* NATIVE-FEEL HORIZONTAL SCROLL HELPER                               */
/* ------------------------------------------------------------------ */
function MobileScrollSection({ 
  title, 
  children, 
  mode 
}: { 
  title: string; 
  children: React.ReactNode; 
  mode: 'fishes' | 'plants' 
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="pt-6 pb-2 bg-white">
      <div className="px-5 mb-4 flex justify-between items-end">
        <h2 className={`text-xl font-bold tracking-tight ${mode === 'fishes' ? 'text-blue-950' : 'text-green-950'}`}>{title}</h2>
        <span className={`text-xs font-semibold uppercase tracking-widest ${mode === 'fishes' ? 'text-blue-600' : 'text-green-700'}`}>See All</span>
      </div>
      <div 
        ref={scrollRef} 
        className="flex overflow-x-auto gap-4 px-5 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {children}
      </div>
    </section>
  );
}



/* ================================================================== */
/* MAIN PAGE                                                          */
/* ================================================================== */
export default function NeoBlueMobileOptimized() {
  const { mode } = useMode();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categoriesFromDb, setCategoriesFromDb] = useState<Array<{ name: string; image: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredCombos, setFeaturedCombos] = useState<any[]>([]);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setIsLoading(true);

        const [productsResponse, categoriesResponse, combosResponse] = await Promise.all([
          fetch('/api/products?limit=100', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/combos?featured=true', { cache: 'no-store' }),
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
          const dbCategories = Array.isArray(categoriesData?.categoriesWithImages) ? categoriesData.categoriesWithImages : [];
          setCategoriesFromDb(dbCategories);
        } else {
          setCategoriesFromDb([]);
        }

        if (combosResponse.ok) {
          const combosData = await combosResponse.json();
          setFeaturedCombos(combosData.combos ?? []);
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

  // Filter products by mode
  const modeFilteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (mode === 'fishes') {
        return p.category !== 'Plants';
      } else {
        return p.category === 'Plants';
      }
    });
  }, [products, mode]);

  const cards = useMemo<HeroCardProduct[]>(
    () =>
      modeFilteredProducts.map((product) => ({
        id: product._id,
        title: product.title,
        price: product.price,
        img: product.images?.[0] || DEFAULT_IMAGE,
        tag: product.tag,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        createdAt: product.createdAt,
        isTrending: product.isTrending,
        isNewArrival: product.isNewArrival,
        category: product.category,
        perPairPrice: product.perPairPrice,
        perPiecePrice: product.perPiecePrice,
        inStock: product.inStock,
      })),
    [modeFilteredProducts]
  );

  const trendingProducts = useMemo(() => {
    const selected = cards.filter((c) => c.isTrending);
    if (selected.length > 0) return selected;
    return [...cards].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)).slice(0, 8);
  }, [cards]);

  const newArrivalProducts = useMemo(() => {
    const selected = cards.filter((c) => c.isNewArrival);
    if (selected.length > 0) return selected;
    return [...cards]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 8);
  }, [cards]);

  const categories = useMemo(() => {
    const list = categoriesFromDb.length > 0
      ? categoriesFromDb
      : (PRODUCT_CATEGORIES as unknown as string[]).map(name => ({ name, image: getCategoryImage(name) }));

    const filtered = list.filter((cat) => {
      if (mode === 'fishes') {
        return cat.name !== 'Plants';
      } else {
        return cat.name === 'Plants';
      }
    });

    return filtered.map((cat) => ({
      label: cat.name,
      image: cat.image,
    }));
  }, [categoriesFromDb, mode]);

  return (
    <div className={`min-h-screen bg-white pb-20 md:pb-0 font-sans transition-colors duration-500 ${
      mode === 'fishes' ? 'text-blue-950 selection:bg-blue-100' : 'text-green-950 selection:bg-green-100'
    }`}>
      <>
      {/* 2. AD BANNER (Hero) */}
      <section className="px-4 pt-4 pb-2 bg-white">
        <div className={`relative w-full rounded-3xl overflow-hidden shadow-sm flex flex-col justify-center p-6 min-h-55 transition-colors duration-500 ${
          mode === 'fishes' ? 'bg-blue-600' : 'bg-green-700'
        }`}>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float-slow" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float-reverse" />
          
          <div className="relative z-10 animate-fade-in-up">
            <h1 className="text-2xl font-black text-white leading-tight mb-2">
              {mode === 'fishes' ? (
                <>Save 35% on All<br/>Premium Stock</>
              ) : (
                <>Save 35% on All<br/>Aquatic Plants</>
              )}
            </h1>
            <p className="text-blue-100 text-xs mb-5 font-light max-w-[80%]">
              {isLoading
                ? 'Loading live inventory...'
                : mode === 'fishes' 
                  ? `Live arrival guaranteed across ${modeFilteredProducts.length} in-stock fish and aquatic listings.`
                  : `100% fresh arrival guaranteed across ${modeFilteredProducts.length} snail-free plant variants.`
              }
            </p>
            <Link 
              href="/products"
              className={`h-10 px-5 rounded-full bg-white text-xs font-bold uppercase tracking-wider inline-flex items-center w-fit shadow-sm transition-colors ${
                mode === 'fishes' ? 'text-blue-700' : 'text-green-800'
              }`}
            >
              Claim Deal <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES (Circular Scroll) */}
      {categories.length > 0 && (
        <section className="pt-6 pb-2 bg-white">
          <div className="flex overflow-x-auto gap-5 px-5 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((cat, i) => {
              const isPlants = toCategorySlug(cat.label) === 'plants';
              return (
                <Link
                  key={i}
                  href={`/categories/${toCategorySlug(cat.label)}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="flex flex-col items-center gap-2 shrink-0 snap-start group animate-fade-in-up"
                >
                  <div className={`relative w-15 h-15 rounded-full overflow-hidden border bg-slate-50 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${
                    isPlants 
                      ? 'border-green-300 ring-2 ring-green-100 group-hover:ring-green-300' 
                      : 'border-blue-100 group-hover:border-blue-300 group-hover:ring-4 group-hover:ring-blue-100/50'
                  }`}>
                    <Image 
                      src={cat.image} 
                      alt={cat.label} 
                      fill
                      sizes="60px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${
                    isPlants 
                      ? 'text-green-700 font-extrabold group-hover:text-green-800' 
                      : 'text-blue-900/70 group-hover:text-blue-950 font-bold'
                  }`}>{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. TRENDING */}
      <MobileScrollSection title="Trending Now" mode={mode}>
        {trendingProducts.map((product, idx) => (
          <ProductCard key={`trend-${product.id}`} product={product} idx={idx} className="w-40 md:w-55 shrink-0 snap-start" />
        ))}
        {!isLoading && trendingProducts.length === 0 ? (
          <div className={`w-full rounded-2xl border border-dashed p-4 text-xs ${
            mode === 'fishes' ? 'border-blue-100 text-blue-600' : 'border-green-100 text-green-700'
          }`}>
            No live products available right now.
          </div>
        ) : null}
      </MobileScrollSection>

      {/* 5. NEW ARRIVALS */}
      <MobileScrollSection title="New Arrivals" mode={mode}>
        {newArrivalProducts.map((product, idx) => (
          <ProductCard key={`new-${product.id}`} product={product} idx={idx} className="w-40 md:w-55 shrink-0 snap-start" />
        ))}
        {!isLoading && newArrivalProducts.length === 0 ? (
          <div className={`w-full rounded-2xl border border-dashed p-4 text-xs ${
            mode === 'fishes' ? 'border-blue-100 text-blue-600' : 'border-green-100 text-green-700'
          }`}>
            New arrivals will appear as soon as products are published.
          </div>
        ) : null}
      </MobileScrollSection>

      {/* 6. FEATURED COMBOS */}
      {featuredCombos.length > 0 && (
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5 ${mode === 'fishes' ? 'text-blue-500' : 'text-emerald-600'}`}>Exclusive</p>
              <h2 className="text-lg font-black text-slate-900">Combo Packages</h2>
            </div>
            <Link href="/combos" className={`text-xs font-semibold flex items-center gap-1 ${mode === 'fishes' ? 'text-blue-600' : 'text-emerald-600'}`}>
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {featuredCombos.slice(0, 6).map((combo: any) => {
              const savings = combo.originalPrice && combo.originalPrice > combo.price
                ? Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)
                : 0;
              return (
                <Link
                  key={combo._id}
                  href={`/combos/${combo._id}`}
                  className="group shrink-0 w-44 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm active:scale-95 transition-transform"
                >
                  <div className="relative h-28 bg-slate-100 overflow-hidden">
                    {combo.coverImage ? (
                      <img src={combo.coverImage} alt={combo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                    {savings > 0 && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{savings}% off</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-900 truncate">{combo.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{combo.products?.length ?? 0} items</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-sm font-black ${mode === 'fishes' ? 'text-blue-700' : 'text-emerald-700'}`}>₹{combo.price}</span>
                      {combo.originalPrice && <span className="text-[10px] text-slate-400 line-through">₹{combo.originalPrice}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      </>

      {/* Basic spacing for desktop footer */}
      <div className={`hidden md:block py-10 text-center text-xs ${mode === 'fishes' ? 'text-blue-300' : 'text-green-700/50'}`}>
      </div>
    </div>
  );
}