"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight, Sparkles, Waves, Leaf, Shield, ArrowRight,
  Fish, Droplets, Package, Clock, ChevronLeft, ChevronRight,
  Star, Zap, TrendingUp, Gift, Heart, Truck
} from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */
type HomeProduct = MarketplaceProduct & {
  approvalStatus?: 'pending' | 'approved' | 'rejected';
};

/* ------------------------------------------------------------------ */
/*  CONFIG + FALLBACK DATA                                             */
/* ------------------------------------------------------------------ */
const defaultOfferConfig = {
  offerBadge: 'Limited Time Offer',
  offerTitle: 'Save Up To 35% On\nPremium Aquatic Stock',
  offerDescription: 'Weekend special: handpicked marine and freshwater species, overnight transit care, and live-arrival protection included.',
  offerButtonText: 'Shop The Offer',
  offerButtonLink: '/products',
  stat1Value: '500+',
  stat1Label: 'Species Curated',
  stat2Value: '24h',
  stat2Label: 'Priority Dispatch',
  stat3Value: '100%',
  stat3Label: 'Live Arrival Cover',
};

const HERO_SLIDES = [
  {
    badge: 'Limited Time Offer',
    title: 'Save Up To 35% On\nPremium Aquatic Stock',
    description: 'Weekend special: handpicked marine and freshwater species, overnight transit care, and live-arrival protection included.',
    cta: 'Shop The Offer',
    ctaLink: '/products',
    gradient: 'from-blue-600 via-blue-700 to-indigo-800',
    accentColor: 'text-blue-200',
  },
  {
    badge: 'Exotic Collection',
    title: 'Discover Rare &\nExotic Fish Species',
    description: 'From vibrant Mandarin Gobys to majestic Emperor Angelfish — explore our premium curated exotic collection.',
    cta: 'Explore Exotic',
    ctaLink: '/categories',
    gradient: 'from-cyan-600 via-teal-700 to-blue-800',
    accentColor: 'text-cyan-200',
  },
  {
    badge: 'New Arrivals',
    title: 'Fresh Stock Just\nLanded This Week',
    description: 'Be the first to bring home newly arrived species — quarantined, acclimated, and ready for your aquarium.',
    cta: 'See New Arrivals',
    ctaLink: '/products',
    gradient: 'from-indigo-600 via-blue-700 to-cyan-800',
    accentColor: 'text-indigo-200',
  },
];

const CATEGORY_SHORTCUTS = [
  { label: 'Guppies', icon: Fish, href: '/categories', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { label: 'Crayfish', icon: Droplets, href: '/categories', color: 'bg-red-50 text-red-500 border-red-100' },
  { label: 'Betta', icon: Sparkles, href: '/categories', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { label: 'Plants', icon: Leaf, href: '/products?cat=plants', color: 'bg-green-50 text-green-600 border-green-100' },
  { label: 'Accessories', icon: Package, href: '/products?cat=accessories', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { label: 'Kribensis', icon: Fish, href: '/categories', color: 'bg-teal-50 text-teal-600 border-teal-100' },
  { label: 'Platy', icon: Fish, href: '/categories', color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { label: 'Food', icon: Gift, href: '/products?cat=food', color: 'bg-orange-50 text-orange-600 border-orange-100' },
];

const QUICK_ACTIONS = [
  { label: 'Under ₹99', subtitle: 'Budget Finds', icon: Zap, gradient: 'from-blue-50 to-cyan-50', border: 'border-blue-100', iconColor: 'text-blue-500', href: '/products?maxPrice=99' },
  { label: 'Best Sellers', subtitle: 'Top Picks', icon: TrendingUp, gradient: 'from-purple-50 to-blue-50', border: 'border-purple-100', iconColor: 'text-purple-500', href: '/products?sort=bestseller' },
  { label: 'Beginner Kits', subtitle: 'Start Here', icon: Package, gradient: 'from-green-50 to-emerald-50', border: 'border-green-100', iconColor: 'text-green-500', href: '/products?cat=beginner' },
  { label: 'Combo Packs', subtitle: 'Save More', icon: Gift, gradient: 'from-amber-50 to-orange-50', border: 'border-amber-100', iconColor: 'text-amber-500', href: '/products?cat=combo' },
];

const TRUST_ITEMS = [
  { icon: Package, label: 'Safe Packaging', description: 'Insulated & shock-proof' },
  { icon: Fish, label: 'Live Arrival Guarantee', description: '100% assured delivery' },
  { icon: Clock, label: '24h Dispatch', description: 'Ships within 24 hours' },
  { icon: Truck, label: 'Free Delivery', description: 'On orders above ₹499' },
];

const fallbackFeaturedFishes = [
  {
    id: 'fallback-1',
    name: 'Emperor Angelfish',
    scientific: 'Pomacanthus imperator',
    price: 129,
    img: 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg',
    tag: 'Rare',
  },
  {
    id: 'fallback-2',
    name: 'Mandarin Goby',
    scientific: 'Synchiropus splendidus',
    price: 45,
    img: 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg',
    tag: 'Vibrant',
  },
  {
    id: 'fallback-3',
    name: 'Lionfish',
    scientific: 'Pterois',
    price: 85,
    img: 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg',
    tag: 'Exotic',
  },
  {
    id: 'fallback-4',
    name: 'Clownfish',
    scientific: 'Amphiprioninae',
    price: 65,
    img: 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg',
    tag: 'Popular',
  },
  {
    id: 'fallback-5',
    name: 'Blue Tang',
    scientific: 'Paracanthurus hepatus',
    price: 110,
    img: 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg',
    tag: 'Trending',
  },
];

/* ------------------------------------------------------------------ */
/*  HORIZONTAL SCROLL HELPER                                           */
/* ------------------------------------------------------------------ */
function HScrollSection({
  title,
  subtitle,
  viewAllHref,
  children,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            {subtitle && (
              <p className="text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-2">{subtitle}</p>
            )}
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex h-9 w-9 rounded-full border border-gray-200 items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex h-9 w-9 rounded-full border border-gray-200 items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="ml-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
              >
                View All <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Scroll container */}
        <div ref={scrollRef} className="scroll-row gap-4 md:gap-5 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {children}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PRODUCT CARD (clean, premium)                                      */
/* ------------------------------------------------------------------ */
function ProductCard({
  product,
}: {
  product: { _id: string; title: string; price: number; images?: string[]; tag?: string; scientific?: string; waterType?: string; category?: string; rating?: number };
}) {
  return (
    <Link
      href={`/products/${product._id}`}
      className="group w-[calc(50vw-28px)] md:w-[280px] rounded-2xl overflow-hidden border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          src={product.images?.[0] ?? 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.tag && (
          <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 bg-white/90 backdrop-blur-sm border border-blue-100 text-blue-700">
            {product.tag}
          </span>
        )}
        <button
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        {product.waterType && product.category && (
          <p className="text-[10px] text-blue-600 uppercase tracking-wider mb-1.5 font-semibold">
            {product.waterType} · {product.category}
          </p>
        )}
        <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug line-clamp-2">{product.title}</h3>
        {product.scientific && (
          <p className="text-xs text-slate-400 italic mb-2">{product.scientific}</p>
        )}

        {/* Stars */}
        {product.rating !== undefined && (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.round(product.rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">{product.rating?.toFixed(1)}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-black text-slate-900">₹{product.price?.toFixed(0)}</span>
          <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Free Delivery</span>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  COLLECTION CARD (image-overlay style)                              */
/* ------------------------------------------------------------------ */
function CollectionCard({
  fish,
}: {
  fish: { id: string; name: string; scientific: string; price: number | string; img: string; tag: string };
}) {
  return (
    <div className="group w-[220px] md:w-[260px] h-[280px] md:h-[320px] relative rounded-2xl overflow-hidden bg-white border border-blue-100 hover:border-blue-300 transition-colors duration-300 shadow-sm flex-shrink-0">
      <img
        src={fish.img}
        alt={fish.name}
        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white">
        {fish.tag}
      </div>

      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-blue-200/80 text-[10px] italic mb-0.5 font-serif">{fish.scientific}</p>
        <h3 className="text-base md:text-lg font-bold text-white leading-tight mb-1">{fish.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/90">
            {typeof fish.price === 'number' ? `₹${fish.price}` : fish.price}
          </span>
          <button className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-blue-600 transition-all">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MAIN PAGE COMPONENT                                                */
/* ================================================================== */
export default function NeoBlueHomepage() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [offerConfig, setOfferConfig] = useState(defaultOfferConfig);
  const [activeSlide, setActiveSlide] = useState(0);

  /* ---------- DATA FETCHING ---------- */
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setOfferConfig(data);
        }
      } catch (err) {
        console.error('Failed to fetch config', err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setProducts(data.products ?? []);
    };
    fetchProducts();
  }, []);

  /* ---------- CAROUSEL AUTO-SLIDE ---------- */
  const goToSlide = useCallback((index: number) => {
    setActiveSlide(index);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  /* ---------- DERIVED DATA ---------- */
  const approvedFish = useMemo(() => {
    return products
      .filter((product) => (product.approvalStatus ?? 'approved') === 'approved')
      .sort((a, b) => b.rating - a.rating || b.price - a.price);
  }, [products]);

  const featuredFishes = useMemo(() => {
    const live = approvedFish.slice(0, 5).map((product, index) => ({
      id: product._id,
      name: product.title,
      scientific: product.scientific ?? 'Aquatic premium stock',
      price: product.price,
      img: product.images?.[0] ?? fallbackFeaturedFishes[index]?.img ?? '',
      tag: product.tag || fallbackFeaturedFishes[index]?.tag || 'Featured',
    }));

    if (live.length >= 5) return live;
    return [
      ...live,
      ...fallbackFeaturedFishes.slice(live.length).map((item, i) => ({ ...item, id: `${item.id}-${i}` })),
    ];
  }, [approvedFish]);

  const trendingProducts = useMemo(() => {
    const liveTrending = approvedFish.slice(0, 5) as (HomeProduct & { tag?: string; scientific?: string })[];
    if (liveTrending.length >= 5) return liveTrending;

    const fallbacks = fallbackFeaturedFishes.map((fish) => ({
      _id: fish.id,
      title: fish.name,
      description: 'Trending premium stock',
      price: fish.price,
      images: [fish.img],
      category: 'Exotic' as const,
      waterType: 'Freshwater' as const,
      scientific: fish.scientific,
      tag: fish.tag,
      rating: 5,
      inStock: true,
      vendorId: 'neoblue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as unknown as (HomeProduct & { tag?: string; scientific?: string })[];

    return [...liveTrending, ...fallbacks.slice(liveTrending.length)];
  }, [approvedFish]);

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-blue-500 selection:text-white flex flex-col">

      {/* ============================================================
          1. HERO CAROUSEL
          ============================================================ */}
      <section className="relative overflow-hidden">
        {/* Slides */}
        <div className="relative h-[420px] md:h-[460px]">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`carousel-slide flex items-center ${slide.gradient ? `bg-gradient-to-br ${slide.gradient}` : ''}`}
            >
              {/* Ambient blurs */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 md:py-16">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-5">
                    <Sparkles className="h-3 w-3" /> {slide.badge}
                  </div>

                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-3 md:mb-4 text-white">
                    {slide.title.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < slide.title.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </h1>

                  <p className={`${slide.accentColor} text-sm md:text-base max-w-xl mb-6 md:mb-7 opacity-80`}>
                    {slide.description}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={slide.ctaLink}
                      className="h-11 md:h-12 px-6 md:px-7 rounded-full bg-white text-slate-900 hover:bg-blue-50 transition-colors font-semibold inline-flex items-center justify-center gap-2 shadow-sm text-sm"
                    >
                      {slide.cta} <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/#trending"
                      className="h-11 md:h-12 px-6 md:px-7 rounded-full border border-white/25 text-white hover:bg-white/10 transition-colors font-medium inline-flex items-center justify-center text-sm"
                    >
                      See Trending
                    </Link>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-6 md:gap-8 mt-8">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-white">{offerConfig.stat1Value}</p>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">{offerConfig.stat1Label}</p>
                    </div>
                    <div className="w-px bg-white/15" />
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-white">{offerConfig.stat2Value}</p>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">{offerConfig.stat2Label}</p>
                    </div>
                    <div className="w-px bg-white/15" />
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-white">{offerConfig.stat3Value}</p>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">{offerConfig.stat3Label}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`carousel-dot ${index === activeSlide ? 'active' : ''}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next arrows */}
          <button
            onClick={() => goToSlide((activeSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goToSlide((activeSlide + 1) % HERO_SLIDES.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Active slide tracker (JS) */}
        <style>{`
          .carousel-slide:nth-child(${activeSlide + 1}) { opacity:1; pointer-events:auto; }
        `}</style>
      </section>

      {/* ============================================================
          2. CATEGORY SHORTCUT STRIP
          ============================================================ */}
      <section className="py-6 md:py-8 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scroll-row gap-3 md:gap-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {CATEGORY_SHORTCUTS.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className={`flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border ${cat.color} hover:shadow-md transition-all min-w-[80px]`}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/60">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          3. QUICK ACTION GRID
          ============================================================ */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`group rounded-2xl bg-gradient-to-br ${action.gradient} border ${action.border} p-4 md:p-5 hover:shadow-md transition-all flex flex-col gap-3`}
                >
                  <div className={`h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${action.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900">{action.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{action.subtitle}</p>
                  </div>
                  <div className="mt-auto">
                    <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 inline-flex items-center gap-0.5 transition-colors">
                      Explore <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. FEATURED PICKS — horizontal scroll
          ============================================================ */}
      <section className="py-8 md:py-12 bg-gray-50/50">
        <HScrollSection
          title="Featured Picks"
          subtitle="Editor's Choice"
          viewAllHref="/products"
        >
          {/* Featured Ad Pick card (larger) */}
          <div className="w-[300px] md:w-[340px] rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex-shrink-0 group">
            <div className="p-5 border-b border-gray-50 bg-gradient-to-br from-blue-50 to-white">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-700">Featured Ad Pick</p>
              <h3 className="text-xl font-black text-slate-900 mt-1.5">Emperor Angelfish Bundle</h3>
              <p className="text-slate-500 text-xs mt-1">Includes acclimation kit + feeding starter pack.</p>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src="https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg"
                alt="Promotional Fish Offer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ad Price</p>
                <p className="text-2xl font-black text-blue-700">₹84</p>
              </div>
              <Link
                href="/products"
                className="h-10 px-5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold text-sm inline-flex items-center"
              >
                Claim Deal
              </Link>
            </div>
          </div>

          {/* Additional featured product cards */}
          {featuredFishes.slice(0, 4).map((fish) => (
            <ProductCard
              key={fish.id}
              product={{
                _id: fish.id,
                title: fish.name,
                price: typeof fish.price === 'number' ? fish.price : parseFloat(String(fish.price).replace(/[₹,]/g, '')) || 0,
                images: [fish.img],
                tag: fish.tag,
                scientific: fish.scientific,
                rating: 4.5,
              }}
            />
          ))}
        </HScrollSection>
      </section>

      {/* ============================================================
          5. BANNER BREAK — Trust / Delivery
          ============================================================ */}
      <section className="py-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm md:text-base">Free Delivery on Orders Above ₹499</p>
              <p className="text-blue-200/70 text-xs">Safe live fish packaging with temperature-controlled transit</p>
            </div>
          </div>
          <Link
            href="/products"
            className="h-10 px-5 rounded-full bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors inline-flex items-center gap-2 shrink-0"
          >
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ============================================================
          6. THE COLLECTION — horizontal scroll
          ============================================================ */}
      <section className="py-10 md:py-14 bg-white">
        <HScrollSection
          title={<>The <span className="text-blue-500">Collection</span></> as unknown as string}
          viewAllHref="/products"
        >
          {featuredFishes.map((fish) => (
            <CollectionCard
              key={fish.id}
              fish={{
                id: fish.id,
                name: fish.name,
                scientific: fish.scientific,
                price: fish.price,
                img: fish.img,
                tag: fish.tag,
              }}
            />
          ))}

          {/* Info card inline */}
          <div className="w-[220px] md:w-[260px] h-[280px] md:h-[320px] rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-5 md:p-6 flex flex-col justify-center relative overflow-hidden group flex-shrink-0">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-200/40 rounded-full blur-2xl group-hover:bg-blue-200/60 transition-all duration-500" />
            <Shield className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-base font-bold text-slate-900 mb-2">Zero-Stress Transit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our patented acoustic-dampened shipping containers ensure calm for your livestock during overnight delivery.
            </p>
          </div>
        </HScrollSection>
      </section>

      {/* ============================================================
          7. TRENDING / MOST WANTED — horizontal scroll
          ============================================================ */}
      <section id="trending" className="py-10 md:py-14 bg-blue-50/40">
        <HScrollSection
          title="Most Wanted This Week"
          subtitle="Trending Now"
          viewAllHref="/products"
        >
          {trendingProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={{
                _id: product._id,
                title: product.title,
                price: product.price,
                images: product.images,
                tag: product.tag,
                scientific: product.scientific,
                waterType: product.waterType,
                category: product.category,
                rating: product.rating,
              }}
            />
          ))}
        </HScrollSection>
      </section>

      {/* ============================================================
          9. TRUST SECTION — subtle icons row
          ============================================================ */}
      <section className="py-8 md:py-10 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-white border border-gray-100">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          10. FOOTER — kept from original
          ============================================================ */}
      <footer id="contact" className="relative pt-20 md:pt-28 pb-10 bg-white border-t border-blue-100 overflow-hidden z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16 md:mb-20">

            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-5">
                <Waves className="h-7 w-7 text-blue-500" />
                <span className="font-black text-2xl tracking-tighter text-slate-900">
                  NEO<span className="text-blue-500">BLUE</span>
                </span>
              </div>
              <p className="text-slate-600 text-sm font-light max-w-sm mb-6">
                The apex of aquatic commerce. Curating the ocean&apos;s finest for the discerning hobbyist.
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white border border-blue-200 rounded-full px-5 py-2.5 w-full max-w-xs text-slate-900 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="md:col-span-2 md:col-start-8">
              <h4 className="text-slate-900 font-bold tracking-wider uppercase text-xs mb-5">Inventory</h4>
              <ul className="space-y-3 text-slate-600 font-light text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Marine Fish</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Freshwater Fish</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Invertebrates</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Live Coral</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-slate-900 font-bold tracking-wider uppercase text-xs mb-5">Company</h4>
              <ul className="space-y-3 text-slate-600 font-light text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Our Ethos</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Quarantine Process</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Journal</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="w-full border-t border-blue-100 pt-6 flex flex-col items-center justify-center">
            <h2 className="text-[15vw] md:text-[10rem] font-black tracking-tighter leading-none text-blue-50 select-none pointer-events-none">
              NEOBLUE
            </h2>
            <div className="w-full flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs mt-6">
              <p>© 2026 NeoBlue Aquatics. All rights reserved.</p>
              <div className="flex gap-5 mt-3 md:mt-0">
                <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Shipping</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}