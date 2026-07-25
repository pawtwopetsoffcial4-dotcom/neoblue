"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Package, Truck, ShieldCheck, Star, Headset,
  Fish, Sparkles, ChevronLeft, ChevronRight, Tag, Zap, Heart
} from 'lucide-react';
import ReviewStars from '@/app/components/ReviewStars';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { PRODUCT_CATEGORIES, getCategoryImage } from '@/lib/catalog';
import { useMode } from '@/lib/hooks/useMode';
import ComingSoonPlants from '@/app/components/ComingSoonPlants';

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
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
};

const DEFAULT_IMAGE = 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg';

const extractProducts = (payload: unknown): MarketplaceProduct[] => {
  if (Array.isArray(payload)) return payload as MarketplaceProduct[];
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as { products?: unknown; data?: { products?: unknown } };
  if (Array.isArray(data.products)) return data.products as MarketplaceProduct[];
  if (Array.isArray(data.data?.products)) return data.data!.products as MarketplaceProduct[];
  return [];
};

const toCategorySlug = (category: string) =>
  category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ------------------------------------------------------------------ */
/* PRODUCT CARD                                                        */
/* ------------------------------------------------------------------ */
function ProductCard({ product, mode, index = 0 }: { product: HeroCardProduct; mode: 'fishes' | 'plants'; index?: number }) {
  const rating = typeof product.rating === 'number' ? product.rating : 5;
  const reviewsCount = product.reviewsCount ?? 0;
  const unitPrice = product.perPairPrice ?? product.perPiecePrice ?? product.price;
  const unitLabel = product.perPairPrice != null ? 'Pair' : 'Piece';

  const isFishes = mode === 'fishes';
  const btnStyle = isFishes
    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white';
  
  const tagBg = isFishes ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white';
  const hoverBorder = isFishes ? 'hover:border-blue-400 hover:shadow-blue-500/10' : 'hover:border-emerald-400 hover:shadow-emerald-500/10';

  return (
    <div
      style={{ animationDelay: `${index * 50}ms` }}
      className={`group relative flex flex-col h-full rounded-2xl bg-white border border-slate-200/80 p-2.5 md:p-3 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-up hover:-translate-y-1 ${hoverBorder}`}
    >
      {/* Inner Image Frame */}
      <Link href={`/products/${product.id}`} className="relative block aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-2.5 border border-slate-100">
        <Image
          src={product.img}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        
        {/* Top-Left Tag / Offer Badge */}
        {product.tag && String(product.tag).toLowerCase() !== 'standard' && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm ${tagBg}`}>
            {product.tag}
          </span>
        )}

        {/* Bottom-Right Unit Label Badge */}
        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold text-slate-700 bg-white/90 backdrop-blur-md shadow-sm border border-slate-100">
          1 {unitLabel}
        </span>
      </Link>

      {/* Content Details */}
      <div className="flex flex-col flex-1 justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 truncate">
            {product.category}
          </span>

          <Link href={`/products/${product.id}`} className="block">
            <h3 className="text-xs md:text-sm font-extrabold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
              {product.title}
            </h3>
          </Link>

          <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-slate-600">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{rating.toFixed(1)}</span>
            {reviewsCount > 0 && <span className="text-slate-400 text-[10px] font-normal">({reviewsCount})</span>}
          </div>
        </div>

        {/* Quick Commerce Bottom Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Price</span>
            <span className="text-base md:text-lg font-black tracking-tight text-slate-900 leading-none">
              ₹{unitPrice}
            </span>
          </div>

          <Link
            href={`/products/${product.id}`}
            className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-xs hover:scale-105 active:scale-95 ${btnStyle}`}
          >
            <span>+ ADD</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION HEADER                                                      */
/* ------------------------------------------------------------------ */
function SectionHeader({ eyebrow, title, linkHref, linkText, mode }: {
  eyebrow: string;
  title: string;
  linkHref: string;
  linkText: string;
  mode: 'fishes' | 'plants';
}) {
  return (
    <div className="flex items-end justify-between mb-6 md:mb-8">
      <div>
        <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-1.5 ${mode === 'fishes' ? 'text-blue-500' : 'text-emerald-600'}`}>
          {eyebrow}
        </p>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
      </div>
      <Link
        href={linkHref}
        className={`hidden md:flex items-center gap-1.5 text-sm font-bold transition-colors ${
          mode === 'fishes' ? 'text-blue-600 hover:text-blue-800' : 'text-emerald-600 hover:text-emerald-800'
        }`}
      >
        {linkText} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HORIZONTAL SCROLL ROW FOR PRODUCTS                                 */
/* ------------------------------------------------------------------ */
function ProductScrollRow({ products, mode, seeAllHref }: {
  products: HeroCardProduct[];
  mode: 'fishes' | 'plants';
  seeAllHref: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <div className="relative group/row">
      {/* Desktop Nav Arrows */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-600 hover:bg-slate-50 hover:shadow-lg transition-all opacity-0 group-hover/row:opacity-100 duration-300"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-600 hover:bg-slate-50 hover:shadow-lg transition-all opacity-0 group-hover/row:opacity-100 duration-300"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 md:gap-5 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {products.map((product, idx) => (
          <div key={product.id} className="snap-start flex-shrink-0 w-40 sm:w-44 md:w-48 lg:w-[calc(25%-15px)]">
            <ProductCard product={product} mode={mode} index={idx} />
          </div>
        ))}
        {/* See all card */}
        <Link
          href={seeAllHref}
          className={`snap-start flex-shrink-0 w-40 sm:w-44 md:w-48 lg:w-[calc(25%-15px)] flex flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed transition-all min-h-[260px] ${
            mode === 'fishes'
              ? 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mode === 'fishes' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
            <ArrowRight className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold">See All</span>
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HERO PRODUCT CAROUSEL (right side of hero)                         */
/* ------------------------------------------------------------------ */
function HeroProductCarousel({ products, mode }: { products: HeroCardProduct[]; mode: 'fishes' | 'plants' }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const displayProducts = products.slice(0, 5);

  const goTo = (idx: number) => {
    if (animating) return;
    setAnimating(true);
    setActiveIdx(idx);
    setTimeout(() => setAnimating(false), 500);
  };

  useEffect(() => {
    if (displayProducts.length < 2) return;
    const id = setInterval(() => {
      goTo((activeIdx + 1) % displayProducts.length);
    }, 3800);
    return () => clearInterval(id);
  }, [activeIdx, displayProducts.length]);

  if (displayProducts.length === 0) return null;

  const active = displayProducts[activeIdx];
  const nextIdx = (activeIdx + 1) % displayProducts.length;
  const next = displayProducts[nextIdx];
  const unitPrice = active.perPairPrice ?? active.perPiecePrice ?? active.price;
  const unitLabel = active.perPairPrice != null ? 'pair' : 'piece';

  const accentGrad = mode === 'fishes'
    ? 'from-blue-500 to-blue-700'
    : 'from-emerald-500 to-emerald-700';
  const accentLight = mode === 'fishes' ? 'bg-blue-50' : 'bg-emerald-50';
  const accentText = mode === 'fishes' ? 'text-blue-600' : 'text-emerald-600';
  const accentBorder = mode === 'fishes' ? 'border-blue-200' : 'border-emerald-200';

  return (
    <div className={`order-1 lg:order-2 relative flex items-center justify-center py-8 px-6 lg:py-0 ${accentLight}`}>
      {/* Decorative background blobs */}
      <div className={`absolute w-56 h-56 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${accentGrad} -top-10 -right-10`} />
      <div className={`absolute w-40 h-40 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${accentGrad} bottom-10 left-0`} />

      <div className="relative w-full max-w-sm mx-auto">

        {/* ── CARD STACK ── */}
        <div className="relative h-[340px] md:h-[400px] lg:h-[440px]">

          {/* Back card (peek) */}
          <div className="absolute inset-x-4 bottom-0 top-4 rounded-[28px] bg-white/60 shadow-lg border border-white/80 scale-[0.96] origin-bottom" />

          {/* Front cards — transition between them */}
          {displayProducts.map((p, i) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className={`absolute inset-0 rounded-[28px] overflow-hidden bg-white shadow-2xl border border-slate-100 transition-all duration-500 ease-out ${
                i === activeIdx
                  ? 'opacity-100 translate-y-0 scale-100 z-10'
                  : 'opacity-0 translate-y-4 scale-95 z-0 pointer-events-none'
              }`}
            >
              {/* Product Image — 65% height */}
              <div className="relative h-[65%] overflow-hidden">
                <Image
                  src={p.img}
                  alt={p.title}
                  fill
                  priority={i === 0}
                  sizes="400px"
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                />
                {/* Subtle bottom fade */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

                {/* Tag badge */}
                {p.tag && String(p.tag).toLowerCase() !== 'standard' && (
                  <div className={`absolute top-3.5 left-3.5 rounded-full px-3 py-1 text-white text-[10px] font-black uppercase tracking-widest shadow bg-gradient-to-r ${accentGrad}`}>
                    {p.tag}
                  </div>
                )}

                {/* Price floating badge */}
                <div className="absolute top-4 right-4 backdrop-blur-md bg-white/95 border border-white/50 rounded-2xl px-3.5 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center transform transition-transform group-hover:scale-105">
                  <div className={`text-lg font-black leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${accentGrad}`}>₹{unitPrice}</div>
                  <div className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest mt-1 opacity-80">per {unitLabel}</div>
                </div>
              </div>

              {/* Card content — 35% */}
              <div className="p-4 flex flex-col justify-between h-[35%]">
                <div>
                  <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${accentText}`}>{p.category}</p>
                  <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-1">{p.title}</h3>
                  <div className="mt-1.5">
                    <ReviewStars rating={p.rating ?? 5} count={p.reviewsCount ?? 0} compact size={11} />
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${accentText}`}>
                  View Product <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── CONTROLS ── */}
        <div className="flex items-center justify-between mt-5 px-1">
          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {displayProducts.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-400 ${
                  i === activeIdx
                    ? `w-6 h-2 bg-gradient-to-r ${accentGrad}`
                    : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Prev / Next arrows */}
          <div className="flex gap-2">
            <button
              onClick={() => goTo((activeIdx - 1 + displayProducts.length) % displayProducts.length)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all hover:shadow-sm ${accentBorder} bg-white`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => goTo(nextIdx)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow transition-all hover:shadow-md bg-gradient-to-r ${accentGrad}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/* CATEGORY SLIDER                                                     */
/* ------------------------------------------------------------------ */
function CategorySlider({ categories, mode }: { categories: { label: string; image: string }[]; mode: 'fishes' | 'plants' }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <div className="relative group/catslider -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      {/* Arrow buttons */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg items-center justify-center text-slate-600 hover:bg-slate-50 transition-all opacity-0 group-hover/catslider:opacity-100 duration-300 ml-1"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg items-center justify-center text-slate-600 hover:bg-slate-50 transition-all opacity-0 group-hover/catslider:opacity-100 duration-300 mr-1"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {categories.map((cat, i) => (
          <Link
            key={i}
            href={`/categories/${toCategorySlug(cat.label)}`}
            style={{ animationDelay: `${i * 50}ms` }}
            className="group snap-start flex-shrink-0 w-32 md:w-36 lg:w-[calc(25%-15px)] animate-fade-in-up"
          >
            <div className={`relative rounded-2xl overflow-hidden aspect-[4/5] border-2 transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-xl ${
              mode === 'fishes'
                ? 'border-blue-50 group-hover:border-blue-200 group-hover:shadow-blue-100/60'
                : 'border-emerald-50 group-hover:border-emerald-200 group-hover:shadow-emerald-100/60'
            }`}>
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                sizes="208px"
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <p className="text-white font-black text-sm leading-tight">{cat.label}</p>
                <p className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${mode === 'fishes' ? 'text-blue-300' : 'text-emerald-300'}`}>
                  Shop Now <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* MAIN PAGE                                                          */
/* ================================================================== */
export default function HomeTestClient() {
  const { mode } = useMode();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categoriesFromDb, setCategoriesFromDb] = useState<Array<{ name: string; image: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredCombos, setFeaturedCombos] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [storeConfig, setStoreConfig] = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const [productsRes, catRes, combosRes, blogsRes, configRes] = await Promise.all([
          fetch('/api/products?limit=100', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/combos?featured=true', { cache: 'no-store' }),
          fetch('/api/blogs?limit=3', { cache: 'no-store' }),
          fetch('/api/config', { cache: 'no-store' }),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(extractProducts(data).filter(p => (p.approvalStatus ?? 'approved') === 'approved' && p.inStock));
        }
        if (catRes.ok) {
          const data = await catRes.json();
          setCategoriesFromDb(Array.isArray(data?.categoriesWithImages) ? data.categoriesWithImages : []);
        }
        if (combosRes.ok) {
          const data = await combosRes.json();
          setFeaturedCombos(data.combos ?? []);
        }
        if (blogsRes.ok) {
          const data = await blogsRes.json();
          setBlogs(data.blogs ?? data ?? []);
        }
        if (configRes.ok) {
          setStoreConfig(await configRes.json());
        }
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const modeFilteredProducts = useMemo(() =>
    products.filter(p => mode === 'fishes' ? p.category !== 'Plants' : p.category === 'Plants'),
    [products, mode]);

  const cards = useMemo<HeroCardProduct[]>(() =>
    modeFilteredProducts.map(p => ({
      id: p._id,
      title: p.title,
      price: p.price,
      img: p.images?.[0] || DEFAULT_IMAGE,
      tag: p.tag,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      createdAt: p.createdAt,
      isTrending: p.isTrending,
      isNewArrival: p.isNewArrival,
      category: p.category,
      perPairPrice: p.perPairPrice,
      perPiecePrice: p.perPiecePrice,
    })),
    [modeFilteredProducts]);

  const trendingProducts = useMemo(() => {
    const sel = cards.filter(c => c.isTrending);
    return sel.length > 0 ? sel : [...cards].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)).slice(0, 10);
  }, [cards]);

  const newArrivals = useMemo(() => {
    const sel = cards.filter(c => c.isNewArrival);
    return sel.length > 0 ? sel : [...cards].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10);
  }, [cards]);

  const categories = useMemo(() => {
    const list = categoriesFromDb.length > 0
      ? categoriesFromDb
      : (PRODUCT_CATEGORIES as unknown as string[]).map(name => ({ name, image: getCategoryImage(name) }));
    return list
      .filter(c => mode === 'fishes' ? c.name !== 'Plants' : c.name === 'Plants')
      .map(c => ({ label: c.name, image: c.image }));
  }, [categoriesFromDb, mode]);

  // Config fallbacks
  const heroBadge = storeConfig?.offerBadge || (mode === 'fishes' ? 'Live Arrival Guaranteed' : 'Snail-Free Certified');
  const heroTitle = storeConfig?.offerTitle || (mode === 'fishes' ? 'India\'s Premium\nAquarium Marketplace' : 'Rare & Exotic\nAquatic Plants');
  const heroDesc = storeConfig?.offerDescription || (mode === 'fishes'
    ? `Browse ${modeFilteredProducts.length}+ in-stock species with overnight transit care and live-arrival protection.`
    : `Discover ${modeFilteredProducts.length}+ snail-free plant variants with care guides included.`);
  const heroBtnText = storeConfig?.offerButtonText || 'Shop Now';
  const heroBtnLink = storeConfig?.offerButtonLink || '/products';

  const stat1 = { value: storeConfig?.stat1Value || '500+', label: storeConfig?.stat1Label || 'Species Curated' };
  const stat2 = { value: storeConfig?.stat2Value || '24h', label: storeConfig?.stat2Label || 'Priority Dispatch' };
  const stat3 = { value: storeConfig?.stat3Value || '100%', label: storeConfig?.stat3Label || 'Live Arrival Cover' };

  const trustItems = [
    { icon: <Truck className="h-4 w-4" />, text: storeConfig?.trustBadge1 || 'Live Arrival Guaranteed' },
    { icon: <Fish className="h-4 w-4" />, text: storeConfig?.trustBadge2 || '500+ Species Available' },
    { icon: <ShieldCheck className="h-4 w-4" />, text: storeConfig?.trustBadge3 || 'Secure & Encrypted Payments' },
    { icon: <Headset className="h-4 w-4" />, text: storeConfig?.trustBadge4 || '24/7 Aquarist Support' },
    { icon: <Star className="h-4 w-4" />, text: 'Top Rated Vendors Only' },
    { icon: <Sparkles className="h-4 w-4" />, text: 'Handpicked & Quality Checked' },
  ];

  const whyItems = [
    {
      emoji: storeConfig?.why1Icon || '🚚',
      title: storeConfig?.why1Title || 'Live Arrival Promise',
      text: storeConfig?.why1Text || 'Every order is backed by our live-arrival guarantee. If your fish don\'t arrive healthy, we make it right — no questions asked.',
    },
    {
      emoji: storeConfig?.why2Icon || '🧬',
      title: storeConfig?.why2Title || 'Verified Sellers Only',
      text: storeConfig?.why2Text || 'Our vendor approval process ensures you only buy from experienced breeders who meet our quality and care standards.',
    },
    {
      emoji: storeConfig?.why3Icon || '📦',
      title: storeConfig?.why3Title || 'Expert Packing',
      text: storeConfig?.why3Text || 'Oxygen-sealed bags, insulated packaging, and transit-tested techniques keep your aquatic life safe on the journey.',
    },
  ];

  const accentColor = mode === 'fishes' ? 'text-blue-600' : 'text-emerald-600';
  const accentBgLight = mode === 'fishes' ? 'bg-blue-50' : 'bg-emerald-50';

  if (mode === 'plants') {
    return (
      <div className="min-h-screen bg-[#f5f8f6]">
        <ComingSoonPlants />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans">

      {/* ── ECOMMERCE HERO ── */}
      <section className="relative bg-white overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_560px] gap-0 min-h-[520px] md:min-h-[580px] lg:min-h-[620px]">

            {/* LEFT: Offer text */}
            <div className="flex flex-col justify-center py-12 lg:py-16 pr-0 lg:pr-12 order-2 lg:order-1">
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 w-fit rounded-full px-3 py-1.5 mb-5 ${mode === 'fishes' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                <Tag className="h-3 w-3" />
                <span className="text-xs font-black uppercase tracking-widest">{heroBadge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-5">
                {heroTitle.split('\n').map((line: string, i: number) => (
                  <React.Fragment key={i}>
                    {i === 1
                      ? <span className={mode === 'fishes' ? 'text-blue-600' : 'text-emerald-600'}>{line}</span>
                      : line
                    }
                    {i < heroTitle.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h1>

              <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                {isLoading ? 'Loading live inventory...' : heroDesc}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href={heroBtnLink}
                  className={`inline-flex items-center gap-2 h-12 px-7 rounded-full font-bold text-sm text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 ${
                    mode === 'fishes' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  }`}
                >
                  {heroBtnText} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-full font-bold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
                >
                  Browse All
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {[
                  { icon: <Truck className="h-4 w-4" />, text: 'Live Arrival Guaranteed' },
                  { icon: <ShieldCheck className="h-4 w-4" />, text: 'Secure Checkout' },
                  { icon: <Zap className="h-4 w-4" />, text: '24h Dispatch' },
                ].map((t, i) => (
                  <div key={i} className={`flex items-center gap-1.5 text-xs font-semibold ${mode === 'fishes' ? 'text-blue-700' : 'text-emerald-700'}`}>
                    {t.icon} {t.text}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Rotating product images */}
            <HeroProductCarousel products={trendingProducts} mode={mode} />
          </div>
        </div>

        {/* Stats strip at bottom */}
        <div className={`border-t ${mode === 'fishes' ? 'border-blue-50 bg-blue-50/60' : 'border-emerald-50 bg-emerald-50/60'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-slate-200/70 py-4">
              {[stat1, stat2, stat3].map((s, i) => (
                <div key={i} className="flex flex-col items-center py-1">
                  <span className={`text-xl md:text-2xl font-black ${mode === 'fishes' ? 'text-blue-700' : 'text-emerald-700'}`}>{s.value}</span>
                  <span className="text-[11px] md:text-xs text-slate-500 font-semibold mt-0.5 text-center">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className={`bg-white border-b border-slate-100 overflow-hidden`}>
        <div className="flex animate-[trustScroll_25s_linear_infinite] whitespace-nowrap py-3.5">
          {[...trustItems, ...trustItems, ...trustItems].map((item, i) => (
            <div key={i} className={`inline-flex items-center gap-2.5 mx-8 text-slate-600 flex-shrink-0`}>
              <span className={accentColor}>{item.icon}</span>
              <span className="text-sm font-semibold">{item.text}</span>
              <span className="mx-4 text-slate-200">|</span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16 md:space-y-24">

        {/* ── CATEGORY SLIDER ── */}
        {categories.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Browse"
              title="Shop by Category"
              linkHref="/categories"
              linkText="All Categories"
              mode={mode}
            />
            <CategorySlider categories={categories} mode={mode} />
          </section>
        )}

        {/* ── TRENDING ── */}
        {trendingProducts.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Most Popular"
              title="Trending Right Now"
              linkHref="/products"
              linkText="See All Products"
              mode={mode}
            />
            <ProductScrollRow products={trendingProducts} mode={mode} seeAllHref="/products" />
          </section>
        )}

        {/* ── COMBO PACKAGES ── */}
        {featuredCombos.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Exclusive Bundles"
              title="Combo Packages"
              linkHref="/combos"
              linkText="View All Combos"
              mode={mode}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {featuredCombos.slice(0, 5).map((combo: any, i: number) => {
                const savings = combo.originalPrice && combo.originalPrice > combo.price
                  ? Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)
                  : 0;
                return (
                  <Link
                    key={combo._id}
                    href={`/combos/${combo._id}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="group rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 animate-fade-in-up"
                  >
                    <div className="relative h-36 bg-slate-100 overflow-hidden">
                      {combo.coverImage ? (
                        <img src={combo.coverImage} alt={combo.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-10 w-10 text-slate-300" />
                        </div>
                      )}
                      {savings > 0 && (
                        <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow">
                          {savings}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-bold text-slate-900 truncate mb-1">{combo.name}</p>
                      <p className="text-xs text-slate-500 mb-3">{combo.products?.length ?? 0} items included</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black ${mode === 'fishes' ? 'text-blue-700' : 'text-emerald-700'}`}>₹{combo.price}</span>
                        {combo.originalPrice && <span className="text-xs text-slate-400 line-through">₹{combo.originalPrice}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── NEW ARRIVALS ── */}
        {newArrivals.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Fresh Stock"
              title="New Arrivals"
              linkHref="/products"
              linkText="See All Products"
              mode={mode}
            />
            <ProductScrollRow products={newArrivals} mode={mode} seeAllHref="/products" />
          </section>
        )}

        {/* ── WHY NEOBLUE ── */}
        <section className={`rounded-3xl p-8 md:p-12 lg:p-16 ${accentBgLight}`}>
          <div className="text-center mb-10 md:mb-14">
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-3 ${accentColor}`}>Our Promise</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {storeConfig?.whyTitle || 'Why Choose NeoBlue?'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {whyItems.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="text-lg font-black text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-12 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.8),transparent_50%)]" />
          <div className="relative z-10 grid grid-cols-3 gap-6 md:gap-10 text-center">
            {[stat1, stat2, stat3].map((s, i) => (
              <div key={i}>
                <div className="text-3xl md:text-5xl font-black mb-2 text-white">{s.value}</div>
                <div className="text-slate-400 text-sm md:text-base font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BLOG POSTS ── */}
        {blogs.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="From the Aquarium Desk"
              title="Latest Articles"
              linkHref="/blog"
              linkText="Read All Articles"
              mode={mode}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {blogs.slice(0, 3).map((blog: any, i: number) => (
                <Link
                  key={blog._id || i}
                  href={`/blog/${blog.slug || blog._id}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="group flex flex-col rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 animate-fade-in-up"
                >
                  {blog.coverImage && (
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-5">
                    {blog.category && (
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${accentColor}`}>{blog.category}</p>
                    )}
                    <h3 className="font-bold text-slate-900 text-base leading-snug mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">{blog.excerpt}</p>
                    )}
                    <div className="mt-auto flex items-center gap-1.5 text-sm font-bold text-blue-600">
                      Read More <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── BOTTOM CTA ── */}
        <section className={`rounded-3xl bg-gradient-to-br p-8 md:p-14 lg:p-20 text-white text-center relative overflow-hidden ${mode === 'fishes' ? 'from-[#020f2b] via-[#041a50] to-[#061e5e]' : 'from-[#021a08] via-[#04280e] to-[#053012]'}`}>
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-blue-600/10 blur-2xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <Sparkles className="h-8 w-8 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight">
              {storeConfig?.ctaHeadline || 'Build Your Dream\nAquarium Today'}
            </h2>
            <p className="text-blue-200/80 text-base md:text-lg mb-8 leading-relaxed">
              {storeConfig?.ctaSubtext || 'Join thousands of aquarists who trust NeoBlue for quality livestock, plants, and supplies — all with live-arrival guarantee.'}
            </p>
            <Link
              href={storeConfig?.ctaButtonLink || '/products'}
              className="inline-flex items-center gap-2 h-14 px-10 rounded-full bg-white text-slate-900 font-black text-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 shadow-xl"
            >
              {storeConfig?.ctaButtonText || 'Start Shopping'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>

      {/* Scrolling trust bar CSS */}
      <style>{`
        @keyframes trustScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
