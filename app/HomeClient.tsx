"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Waves, Sparkles, Droplets, Package, Fish, Leaf,
  Search, Home, ShoppingBag, User, ArrowRight,
  ChevronLeft, ChevronRight, Store
} from 'lucide-react';
import ReviewStars from '@/app/components/ReviewStars';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { PRODUCT_CATEGORIES, getCategoryImage } from '@/lib/catalog';
import { useMode } from '@/lib/hooks/useMode';
import ProductCard from '@/app/components/ProductCard';
import AnnouncementMarquee from '@/app/components/AnnouncementMarquee';
import { 
  IHeroSlide, 
  DEFAULT_HERO_SLIDES, 
  DEFAULT_FISHES_HERO_SLIDES, 
  DEFAULT_PLANTS_HERO_SLIDES,
  DEFAULT_MARQUEE_TEXT
} from '@/lib/types/config';
import { getTrendingProducts, getNewArrivalProducts } from '@/lib/utils/productAlgorithm';


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
  mode,
  seeAllHref
}: { 
  title: string; 
  children: React.ReactNode; 
  mode: 'fishes' | 'plants';
  seeAllHref?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="pt-6 pb-2 bg-white">
      <div className="px-5 mb-4 flex justify-between items-end">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        {seeAllHref ? (
          <Link href={seeAllHref} className="text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:underline transition-colors">
            See All
          </Link>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">See All</span>
        )}
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



/* ------------------------------------------------------------------ */
/* SKELETON PLACEHOLDERS                                              */
/* ------------------------------------------------------------------ */
function ProductCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] bg-white border border-slate-100 p-0 animate-pulse shadow-2xs ${className}`}>
      <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>
      <div className="p-3 space-y-2">
        <div className="h-2.5 w-14 bg-slate-100 rounded-md" />
        <div className="h-3.5 w-28 bg-slate-200 rounded-md" />
        <div className="h-2.5 w-20 bg-slate-100 rounded-md" />
        <div className="pt-2 flex justify-between items-center">
          <div className="h-4 w-12 bg-slate-200 rounded-md" />
          <div className="h-7 w-7 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
      <div className="w-15 h-15 rounded-full bg-slate-100 border border-slate-200/50" />
      <div className="h-2.5 w-12 bg-slate-200 rounded-full" />
    </div>
  );
}

type HomeClientProps = {
  initialProducts?: MarketplaceProduct[];
  initialCombos?: any[];
  initialCategories?: Array<{ name: string; image: string }>;
  initialHeroSlides?: IHeroSlide[];
  initialHeroSlidesFishes?: IHeroSlide[];
  initialHeroSlidesPlants?: IHeroSlide[];
  initialConfig?: any;
};

/* ================================================================== */
/* MAIN PAGE                                                          */
/* ================================================================== */
export default function NeoBlueMobileOptimized({
  initialProducts = [],
  initialCombos = [],
  initialCategories = [],
  initialHeroSlides = [],
  initialHeroSlidesFishes = [],
  initialHeroSlidesPlants = [],
  initialConfig = null,
}: HomeClientProps) {
  const { mode } = useMode();
  const [products, setProducts] = useState<MarketplaceProduct[]>(initialProducts);
  const [categoriesFromDb, setCategoriesFromDb] = useState<Array<{ name: string; image: string }>>(initialCategories);
  const [featuredCombos, setFeaturedCombos] = useState<any[]>(initialCombos);
  const [heroSlidesFishes, setHeroSlidesFishes] = useState<IHeroSlide[]>(
    initialHeroSlidesFishes && initialHeroSlidesFishes.length > 0 
      ? initialHeroSlidesFishes 
      : DEFAULT_FISHES_HERO_SLIDES
  );
  const [heroSlidesPlants, setHeroSlidesPlants] = useState<IHeroSlide[]>(
    initialHeroSlidesPlants && initialHeroSlidesPlants.length > 0 
      ? initialHeroSlidesPlants 
      : DEFAULT_PLANTS_HERO_SLIDES
  );
  const [marqueeText, setMarqueeText] = useState<string>(
    initialConfig?.marqueeText || DEFAULT_MARQUEE_TEXT
  );
  const [marqueeEnabled, setMarqueeEnabled] = useState<boolean>(
    initialConfig?.marqueeEnabled !== false
  );
  const [marqueeLink, setMarqueeLink] = useState<string>(
    initialConfig?.marqueeLink || '/products'
  );
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setIsLoading(false);
      return;
    }

    const fetchHomepageData = async () => {
      try {
        setIsLoading(true);

        const [productsResponse, categoriesResponse, combosResponse, configResponse] = await Promise.all([
          fetch('/api/products?limit=200'),
          fetch('/api/categories'),
          fetch('/api/combos?featured=true'),
          fetch('/api/config'),
        ]);

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const liveProducts = extractProducts(productsData).filter((product) => {
            const isApproved = (product.approvalStatus ?? 'approved') === 'approved';
            return isApproved && product.inStock;
          });
          setProducts(liveProducts);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          const dbCategories = Array.isArray(categoriesData?.categoriesWithImages) ? categoriesData.categoriesWithImages : [];
          setCategoriesFromDb(dbCategories);
        }

        if (combosResponse.ok) {
          const combosData = await combosResponse.json();
          setFeaturedCombos(combosData.combos ?? []);
        }

        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (Array.isArray(configData?.heroSlidesFishes) && configData.heroSlidesFishes.length > 0) {
            setHeroSlidesFishes(configData.heroSlidesFishes);
          }
          if (Array.isArray(configData?.heroSlidesPlants) && configData.heroSlidesPlants.length > 0) {
            setHeroSlidesPlants(configData.heroSlidesPlants);
          }
          if (typeof configData?.marqueeText === 'string') {
            setMarqueeText(configData.marqueeText);
          }
          if (typeof configData?.marqueeEnabled === 'boolean') {
            setMarqueeEnabled(configData.marqueeEnabled);
          }
          if (typeof configData?.marqueeLink === 'string') {
            setMarqueeLink(configData.marqueeLink);
          }
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepageData();
  }, [initialProducts]);

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

  // Dedicated slide list for current mode
  const activeSlides = useMemo(() => {
    if (mode === 'plants') {
      return heroSlidesPlants && heroSlidesPlants.length > 0 ? heroSlidesPlants : DEFAULT_PLANTS_HERO_SLIDES;
    }
    return heroSlidesFishes && heroSlidesFishes.length > 0 ? heroSlidesFishes : DEFAULT_FISHES_HERO_SLIDES;
  }, [mode, heroSlidesFishes, heroSlidesPlants]);

  // Reset slide index if mode changes or out of range
  useEffect(() => {
    setCurrentSlide(0);
  }, [mode]);

  useEffect(() => {
    if (currentSlide >= activeSlides.length) {
      setCurrentSlide(0);
    }
  }, [activeSlides.length, currentSlide]);

  // Carousel auto-play
  useEffect(() => {
    if (isHovered || activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered, activeSlides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNextSlide();
    } else if (diff < -50) {
      handlePrevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

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

  // Automated Algorithmic Trending Ranking (Velocity Score: Sales + Rating + Reviews + Discount + Recency + Category Diversity)
  const trendingProducts = useMemo(() => {
    return getTrendingProducts(cards, 10);
  }, [cards]);

  // Automated Algorithmic New Arrivals Ranking (Freshness + Diversity)
  const newArrivalProducts = useMemo(() => {
    return getNewArrivalProducts(cards, 10);
  }, [cards]);

  // Automated Accessories Extraction
  const accessoriesProducts = useMemo<HeroCardProduct[]>(() => {
    return products
      .filter((p) => {
        const cat = (p.category || '').toLowerCase();
        return cat === 'accessories' || cat === 'accessory' || cat.includes('accessor');
      })
      .map((product) => ({
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
      }));
  }, [products]);

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
      {/* 1. EDITABLE ANNOUNCEMENT / SHIPPING MARQUEE */}
      <AnnouncementMarquee 
        text={marqueeText} 
        enabled={marqueeEnabled} 
        link={marqueeLink} 
      />

      <>
      {/* 2. HERO CAROUSEL (Exact 16:9 Aspect Ratio, Clickable Banner) */}
      <section className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 bg-white">
        <div 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md flex items-center group select-none transition-all duration-500 bg-slate-950"
        >
          {/* Background Images & Slides */}
          {activeSlides.map((slide, index) => {
            const isActive = index === currentSlide;
            const bgImage = slide.bgImage || (mode === 'fishes' ? DEFAULT_HERO_SLIDES[1].bgImage : DEFAULT_HERO_SLIDES[2].bgImage);
            const targetLink = slide.buttonLink || (slide as any).link || '/products';
            
            return (
              <Link
                key={slide.id || index}
                href={targetLink}
                prefetch={false}
                className={`absolute inset-0 block transition-opacity duration-1000 ease-in-out cursor-pointer ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
                aria-label={slide.title || 'NeoBlue Banner'}
              >
                {/* Background Image */}
                {bgImage ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={bgImage}
                      alt={slide.title || 'NeoBlue Banner'}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, 1200px"
                      className={`object-cover transition-transform duration-7000 ease-out ${
                        isActive ? 'scale-105' : 'scale-100'
                      }`}
                    />
                  </div>
                ) : (
                  <div className={`absolute inset-0 ${
                    mode === 'fishes' 
                      ? 'bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950' 
                      : 'bg-gradient-to-br from-emerald-800 via-green-800 to-teal-950'
                  }`} />
                )}

                {/* Ambient Decorative Overlay for contrast if slide text exists */}
                {slide.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8">
                    {slide.badge && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider mb-1.5 w-fit shadow-xs">
                        <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
                        <span>{slide.badge}</span>
                      </div>
                    )}
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                      {slide.title}
                    </h2>
                    {slide.description && (
                      <p className="text-slate-200 text-[11px] sm:text-xs font-medium mt-1 max-w-lg line-clamp-1 sm:line-clamp-2 drop-shadow-xs">
                        {slide.description}
                      </p>
                    )}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Previous / Next Chevron Navigation */}
          {activeSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); handlePrevSlide(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-90 cursor-pointer shadow-md"
                title="Previous Slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleNextSlide(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-90 cursor-pointer shadow-md"
                title="Next Slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Indicator Dot / Pill Navigation */}
          {activeSlides.length > 1 && (
            <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentSlide(idx); }}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide
                      ? 'w-5 sm:w-6 bg-white shadow-xs'
                      : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. CATEGORIES (Circular Scroll) */}
      <section className="pt-6 pb-2 bg-white">
        <div className="flex overflow-x-auto gap-5 px-5 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isLoading && categories.length === 0 ? (
            Array.from({ length: 7 }).map((_, i) => (
              <CategorySkeleton key={`cat-skel-${i}`} />
            ))
          ) : (
            categories.map((cat, i) => {
              return (
                <Link
                  key={i}
                  href={`/categories/${toCategorySlug(cat.label)}`}
                  prefetch={false}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="flex flex-col items-center gap-2 shrink-0 snap-start group animate-fade-in-up"
                >
                  <div className="relative w-15 h-15 rounded-full overflow-hidden border border-slate-200 bg-slate-50 transition-all duration-300 group-hover:scale-110 group-hover:border-slate-400 group-hover:shadow-md">
                    <Image 
                      src={cat.image} 
                      alt={cat.label} 
                      fill
                      sizes="60px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <span className="text-[10px] font-bold tracking-wide text-slate-700 group-hover:text-slate-900 transition-all duration-300">{cat.label}</span>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* 4. TRENDING */}
      <MobileScrollSection title="Trending Now" mode={mode} seeAllHref="/products">
        {isLoading && trendingProducts.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <ProductCardSkeleton key={`trend-skel-${i}`} className="w-40 md:w-55 shrink-0 snap-start" />
          ))
        ) : (
          trendingProducts.map((product, idx) => (
            <ProductCard key={`trend-${product.id}`} product={product} idx={idx} className="w-40 md:w-55 shrink-0 snap-start" />
          ))
        )}
        {!isLoading && trendingProducts.length === 0 && (
          <div className="w-full rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
            No live products available right now.
          </div>
        )}
      </MobileScrollSection>

      {/* 5. ACCESSORIES */}
      <MobileScrollSection title="Aquarium Accessories" mode={mode} seeAllHref="/categories/accessories">
        {isLoading && accessoriesProducts.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <ProductCardSkeleton key={`acc-skel-${i}`} className="w-40 md:w-55 shrink-0 snap-start" />
          ))
        ) : (
          accessoriesProducts.map((product, idx) => (
            <ProductCard key={`acc-${product.id}`} product={product} idx={idx} className="w-40 md:w-55 shrink-0 snap-start" />
          ))
        )}
        {!isLoading && accessoriesProducts.length === 0 && (
          <div className="w-full rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
            Aquarium filters, lighting, heaters, and accessories will appear here.
          </div>
        )}
      </MobileScrollSection>

      {/* 6. NEW ARRIVALS */}
      <MobileScrollSection title="New Arrivals" mode={mode} seeAllHref="/products">
        {isLoading && newArrivalProducts.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <ProductCardSkeleton key={`new-skel-${i}`} className="w-40 md:w-55 shrink-0 snap-start" />
          ))
        ) : (
          newArrivalProducts.map((product, idx) => (
            <ProductCard key={`new-${product.id}`} product={product} idx={idx} className="w-40 md:w-55 shrink-0 snap-start" />
          ))
        )}
        {!isLoading && newArrivalProducts.length === 0 && (
          <div className="w-full rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
            New arrivals will appear as soon as products are published.
          </div>
        )}
      </MobileScrollSection>

      {/* 6. WHY NEOBLUE / WHY BUY FROM US SECTION */}
      {/* <!-- WHY_NEOBLUE_START --> */}
      <section className="px-4 py-8 bg-slate-50/70 border-y border-slate-100 my-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-full">
              Trust &amp; Quality
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
              Why Buy From NeoBlue?
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
              India's premier live aquatic marketplace built by hobbyists, for hobbyists.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-1">
                🛡️
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">100% Live Arrival</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-relaxed">Full credit or replacement guarantee on all live specimens.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-1">
                🐟
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">Verified Breeders</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-relaxed">Direct from India&apos;s top-rated specialized fish &amp; plant farms.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-1">
                📦
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">Insulated Transit</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-relaxed">Oxygenated packaging with thermal styrofoam climate control.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-lg mb-1">
                🔬
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">Health Certified</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-relaxed">Strict biosecurity quarantine to ensure 100% disease-free stock.</p>
            </div>
          </div>
        </div>
      </section>
      {/* <!-- WHY_NEOBLUE_END --> */}

      {/* 7. SELL WITH US / VENDOR ONBOARDING SECTION */}
      <section className="px-3 sm:px-4 py-3 my-2">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-5 sm:p-7 md:p-8 text-white border border-blue-900/40 shadow-xl">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left Content Area */}
              <div className="space-y-2.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-[10px] sm:text-[11px] font-extrabold text-blue-300 uppercase tracking-wider">
                  <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Seller &amp; Breeder Partner Program</span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                  Breeder or Aquatic Nursery? <span className="text-blue-400">Sell with NeoBlue</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  Join India&apos;s premier dedicated live aquatic marketplace. Showcase your species to tens of thousands of active hobbyists, set custom shipping slabs, and enjoy fast automated payouts.
                </p>

                {/* Key Benefits Pills */}
                <div className="flex flex-wrap gap-2 pt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[11px] font-bold text-slate-200">
                    <span className="text-emerald-400 font-black">✓</span> Pan-India Reach
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[11px] font-bold text-slate-200">
                    <span className="text-emerald-400 font-black">✓</span> Direct Payouts
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[11px] font-bold text-slate-200">
                    <span className="text-emerald-400 font-black">✓</span> Custom Regional Shipping
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[11px] font-bold text-slate-200">
                    <span className="text-emerald-400 font-black">✓</span> Dedicated Storefront
                  </span>
                </div>
              </div>

              {/* Right CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 md:min-w-[210px]">
                <Link
                  href="/auth/vendor-signup"
                  className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <span>Start Selling</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/auth/vendor-login"
                  className="h-10 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <span>Vendor Dashboard Login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FEATURED COMBOS */}
      {featuredCombos.length > 0 && (
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5 text-slate-500">Exclusive</p>
              <h2 className="text-lg font-black text-slate-900">Combo Packages</h2>
            </div>
            <Link href="/combos" className="text-xs font-semibold flex items-center gap-1 text-slate-600 hover:text-slate-900">
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
                  prefetch={false}
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
                      <span className="text-sm font-black text-slate-900">₹{combo.price}</span>
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