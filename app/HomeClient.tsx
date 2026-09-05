"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Waves, Sparkles, Droplets, Package, Fish, Leaf,
  Search, Home, ShoppingBag, User, ArrowRight,
  ChevronLeft, ChevronRight
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
        <h2 className={`text-xl font-bold tracking-tight ${mode === 'fishes' ? 'text-blue-950' : 'text-green-950'}`}>{title}</h2>
        {seeAllHref ? (
          <Link href={seeAllHref} className={`text-xs font-semibold uppercase tracking-widest ${mode === 'fishes' ? 'text-blue-600 hover:text-blue-700' : 'text-green-700 hover:text-green-800'} hover:underline transition-colors`}>
            See All
          </Link>
        ) : (
          <span className={`text-xs font-semibold uppercase tracking-widest ${mode === 'fishes' ? 'text-blue-600' : 'text-green-700'}`}>See All</span>
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
      {/* 2. HERO CAROUSEL */}
      <section className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 bg-white">
        <div 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full rounded-3xl overflow-hidden shadow-lg min-h-[260px] sm:min-h-[300px] md:min-h-[350px] flex items-center group select-none transition-all duration-500 bg-slate-950"
        >
          {/* Background Images & Slides */}
          {activeSlides.map((slide, index) => {
            const isActive = index === currentSlide;
            const bgImage = slide.bgImage || (mode === 'fishes' ? DEFAULT_HERO_SLIDES[1].bgImage : DEFAULT_HERO_SLIDES[2].bgImage);
            
            return (
              <div
                key={slide.id || index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Background Image */}
                {bgImage ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={bgImage}
                      alt={slide.title}
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

                {/* Dark & Brand Gradient Overlays for High-Contrast Typography */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30 md:bg-gradient-to-r md:from-black/90 md:via-black/65 md:to-black/20" />
                <div className={`absolute inset-0 mix-blend-overlay opacity-30 ${
                  mode === 'fishes' ? 'bg-blue-600' : 'bg-emerald-600'
                }`} />

                {/* Ambient Decorative Light Bubbles */}
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/15 rounded-full blur-3xl animate-float-slow pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/15 rounded-full blur-2xl animate-float-reverse pointer-events-none" />

                {/* Slide Content */}
                <div className="relative z-20 h-full flex flex-col justify-center p-6 sm:p-8 md:p-10 max-w-2xl">
                  {/* Badge */}
                  {slide.badge && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider mb-2.5 sm:mb-3 w-fit shadow-xs animate-fade-in-up">
                      <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
                      <span>{slide.badge}</span>
                    </div>
                  )}

                  {/* Title (Single semantic H1 for primary slide, H2 for secondary slides) */}
                  {index === 0 ? (
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-2 sm:mb-3 drop-shadow-md animate-fade-in-up">
                      {slide.title}
                    </h1>
                  ) : (
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-2 sm:mb-3 drop-shadow-md animate-fade-in-up">
                      {slide.title}
                    </h2>
                  )}

                  {/* Description */}
                  {slide.description && (
                    <p className="text-slate-100 text-xs sm:text-sm font-medium mb-5 max-w-lg leading-relaxed drop-shadow-xs line-clamp-2 sm:line-clamp-3 opacity-90 animate-fade-in-up">
                      {slide.description}
                    </p>
                  )}

                  {/* CTA Buttons (Multi-button support) */}
                  {(() => {
                    const slideButtons = Array.isArray(slide.buttons) && slide.buttons.length > 0
                      ? slide.buttons
                      : [{ id: 'default-btn', text: slide.buttonText || 'Shop Now', link: slide.buttonLink || '/products', variant: 'primary' as const }];

                    return (
                      <div className="animate-fade-in-up pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3">
                        {slideButtons.map((btn, bIdx) => {
                          const isSecondary = btn.variant === 'secondary';
                          const isGlass = btn.variant === 'glass';

                          if (isSecondary) {
                            return (
                              <Link
                                key={btn.id || bIdx}
                                href={btn.link || '/products'}
                                className="h-10 sm:h-11 px-5 sm:px-6 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <span>{btn.text}</span>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            );
                          }

                          if (isGlass) {
                            return (
                              <Link
                                key={btn.id || bIdx}
                                href={btn.link || '/products'}
                                className="h-10 sm:h-11 px-5 sm:px-6 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <span>{btn.text}</span>
                                <ArrowRight className="h-4 w-4 text-white/80" />
                              </Link>
                            );
                          }

                          return (
                            <Link
                              key={btn.id || bIdx}
                              href={btn.link || '/products'}
                              className={`h-10 sm:h-11 px-6 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                                mode === 'fishes'
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                              }`}
                            >
                              <span>{btn.text}</span>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}

          {/* Previous / Next Chevron Navigation */}
          {activeSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-90 cursor-pointer shadow-md"
                title="Previous Slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNextSlide(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-90 cursor-pointer shadow-md"
                title="Next Slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Indicator Dot / Pill Navigation */}
          {activeSlides.length > 1 && (
            <div className="absolute bottom-3.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide
                      ? 'w-6 bg-white shadow-xs'
                      : 'w-2 bg-white/40 hover:bg-white/70'
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
              const isPlants = toCategorySlug(cat.label) === 'plants';
              return (
                <Link
                  key={i}
                  href={`/categories/${toCategorySlug(cat.label)}`}
                  prefetch={false}
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
          <div className={`w-full rounded-2xl border border-dashed p-4 text-xs ${
            mode === 'fishes' ? 'border-blue-100 text-blue-600' : 'border-green-100 text-green-700'
          }`}>
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
          <div className={`w-full rounded-2xl border border-dashed p-4 text-xs ${
            mode === 'fishes' ? 'border-blue-100 text-blue-600' : 'border-green-100 text-green-700'
          }`}>
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
          <div className={`w-full rounded-2xl border border-dashed p-4 text-xs ${
            mode === 'fishes' ? 'border-blue-100 text-blue-600' : 'border-green-100 text-green-700'
          }`}>
            New arrivals will appear as soon as products are published.
          </div>
        )}
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