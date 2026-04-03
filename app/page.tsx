"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, Waves, Leaf, Shield, ArrowRight } from 'lucide-react';
import MobileDock from './components/MobileDock';
import type { MarketplaceProduct } from '@/lib/types/marketplace';

type HomeProduct = MarketplaceProduct & {
  approvalStatus?: 'pending' | 'approved' | 'rejected';
};

const fallbackFeaturedFishes = [
  {
    id: 'fallback-1',
    name: 'Emperor Angelfish',
    scientific: 'Pomacanthus imperator',
    price: 129,
    span: 'col-span-12 md:col-span-8 row-span-2',
    img: '/api/placeholder/800/600',
    tag: 'Rare',
  },
  {
    id: 'fallback-2',
    name: 'Mandarin Goby',
    scientific: 'Synchiropus splendidus',
    price: 45,
    span: 'col-span-12 md:col-span-4 row-span-1',
    img: '/api/placeholder/400/300',
    tag: 'Vibrant',
  },
  {
    id: 'fallback-3',
    name: 'Lionfish',
    scientific: 'Pterois',
    price: 85,
    span: 'col-span-12 md:col-span-4 row-span-1',
    img: '/api/placeholder/400/300',
    tag: 'Exotic',
  },
];

export default function NeoBlueImmersive() {
  const [products, setProducts] = useState<HomeProduct[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setProducts(data.products ?? []);
    };

    fetchProducts();
  }, []);

  const approvedFish = useMemo(() => {
    return products
      .filter((product) => (product.approvalStatus ?? 'approved') === 'approved' && product.category === 'Fish')
      .sort((a, b) => b.rating - a.rating || b.price - a.price);
  }, [products]);

  const featuredFishes = useMemo(() => {
    const liveFishes = approvedFish.slice(0, 3).map((product, index) => ({
      id: product._id,
      name: product.title,
      scientific: product.scientific ?? 'Aquatic premium stock',
      price: `$${product.price.toFixed(2)}`,
      span: fallbackFeaturedFishes[index]?.span ?? 'col-span-12 md:col-span-4 row-span-1',
      img: product.images?.[0] ?? fallbackFeaturedFishes[index]?.img ?? '/api/placeholder/400/300',
      tag: product.tag || fallbackFeaturedFishes[index]?.tag || 'Featured',
    }));

    if (liveFishes.length >= 3) {
      return liveFishes;
    }

    return [
      ...liveFishes,
      ...fallbackFeaturedFishes.slice(liveFishes.length).map((item, index) => ({
        ...item,
        id: `${item.id}-${index}`,
      })),
    ];
  }, [approvedFish]);

  const trendingProducts = useMemo(() => {
    return approvedFish.slice(0, 3);
  }, [approvedFish]);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-blue-500 selection:text-white flex flex-col pb-24 md:pb-0">
      {/* Ad-Style Hero Section */}
      <section className="relative overflow-hidden pt-20 md:pt-28 pb-16 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-100 via-white to-white z-0"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-200/40 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-16 w-72 h-72 bg-cyan-200/40 rounded-full blur-[110px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 rounded-4xl bg-linear-to-br from-blue-700 to-blue-500 p-8 md:p-12 text-white shadow-[0_30px_80px_rgba(37,99,235,0.25)]">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-xs font-bold tracking-widest uppercase mb-6">
                <Sparkles className="h-3.5 w-3.5" /> Limited Time Offer
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-5">
                Save Up To 35% On
                <br />
                Premium Aquatic Stock
              </h1>

              <p className="text-blue-100 text-base md:text-lg max-w-2xl mb-8">
                Weekend ad special: handpicked marine and freshwater species, overnight transit care, and live-arrival protection included.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="h-12 px-7 rounded-full bg-white text-blue-700 hover:bg-blue-50 transition-colors font-bold inline-flex items-center justify-center gap-2"
                >
                  Shop The Offer <ArrowUpRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/#trending"
                  className="h-12 px-7 rounded-full border border-white/40 hover:bg-white/10 transition-colors font-semibold inline-flex items-center justify-center"
                >
                  See Trending
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-9">
                <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                  <p className="text-2xl font-black">500+</p>
                  <p className="text-xs text-blue-100 uppercase tracking-wider">Species Curated</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                  <p className="text-2xl font-black">24h</p>
                  <p className="text-xs text-blue-100 uppercase tracking-wider">Priority Dispatch</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 col-span-2 sm:col-span-1">
                  <p className="text-2xl font-black">100%</p>
                  <p className="text-xs text-blue-100 uppercase tracking-wider">Live Arrival Cover</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-4xl border border-blue-100 bg-white shadow-xl overflow-hidden">
              <div className="p-6 border-b border-blue-100 bg-blue-50/60">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-700">Featured Ad Pick</p>
                <h2 className="text-2xl font-black text-slate-900 mt-2">Emperor Angelfish Bundle</h2>
                <p className="text-slate-600 mt-2">Includes acclimation kit + feeding starter pack.</p>
              </div>
              <div className="relative aspect-4/3">
                <img
                  src="/api/placeholder/900/700"
                  alt="Promotional Fish Offer"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Ad Price</p>
                  <p className="text-3xl font-black text-blue-700">$84.00</p>
                </div>
                <Link
                  href="/products"
                  className="h-11 px-6 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold inline-flex items-center"
                >
                  Claim Deal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric Bento Box Gallery */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-20 w-full">
        <div className="flex justify-between items-end mb-12 md:mb-16">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">
            The <span className="text-blue-500">Collection</span>
          </h2>
          <Link
            href="/products"
            className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
          >
            View More Products <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid grid-cols-12 auto-rows-[200px] md:auto-rows-[250px] gap-4 md:gap-6">
          {featuredFishes.map((fish) => (
            <div 
              key={fish.id} 
              className={`${fish.span} group relative rounded-3xl overflow-hidden bg-white border border-blue-100 hover:border-blue-300 transition-colors duration-500 shadow-sm`}
            >
              <img 
                src={fish.img} 
                alt={fish.name} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 via-slate-900/20 to-transparent"></div>
              
              <div className="absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider text-white">
                {fish.tag}
              </div>

              <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex justify-between items-end">
                <div>
                  <p className="text-blue-200 text-xs md:text-sm italic mb-1 font-serif">{fish.scientific}</p>
                  <h3 className="text-xl md:text-3xl font-bold text-white leading-none">{fish.name}</h3>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="text-xl md:text-2xl font-light text-white">{fish.price}</span>
                  <button className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white text-slate-950 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all transform group-hover:rotate-12">
                    <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Abstract Info Card */}
          <div className="col-span-12 md:col-span-4 row-span-1 rounded-3xl bg-linear-to-br from-blue-50 to-white border border-blue-100 p-6 md:p-8 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-200/40 rounded-full blur-2xl group-hover:bg-blue-200/60 transition-all duration-500"></div>
            <Shield className="h-8 w-8 md:h-10 md:w-10 text-blue-600 mb-4 md:mb-6" />
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Zero-Stress Transit</h3>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Our patented acoustic-dampened shipping containers ensure absolute calm for your livestock during overnight delivery.
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold"
          >
            View More Products <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Trending Section */}
      <section id="trending" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-20 bg-blue-50/40 rounded-4xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-3">Trending Now</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Most Wanted This Week</h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-semibold">
            Explore full catalog <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingProducts.map((product) => (
            <article key={product._id} className="group rounded-3xl overflow-hidden border border-blue-100 bg-white hover:border-blue-400 transition-colors shadow-sm">
              <div className="relative aspect-4/3 overflow-hidden">
                <img
                  src={product.images?.[0] ?? '/api/placeholder/400/300'}
                  alt={product.title}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/75 via-slate-900/35 to-transparent" />
                <span className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1 bg-white/85 border border-blue-200 text-blue-700">
                  {product.tag}
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-blue-700 uppercase tracking-wide mb-2">
                  {product.waterType} • {product.category}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{product.title}</h3>
                <p className="text-slate-600 text-sm italic mb-4">{product.scientific ?? 'Aquatic premium stock'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900">${product.price.toFixed(2)}</span>
                  <Link href={`/products/${product._id}`} className="h-10 px-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold text-sm inline-flex items-center">
                    View
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* NEW: Ethos / Typography Break */}
      <section className="relative z-20 py-24 bg-blue-600 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white/90 leading-tight">
            Ethically Sourced. <br/>
            <span className="text-blue-900">Expertly Quarantined.</span> <br/>
            Delivered Alive.
          </h2>
          <div className="mt-12 flex flex-wrap gap-8">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse"></div>
              <span className="text-blue-100 font-medium tracking-wide">100% Survival Guarantee</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse"></div>
              <span className="text-blue-100 font-medium tracking-wide">30-Day Conditioning</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse"></div>
              <span className="text-blue-100 font-medium tracking-wide">Vet-Certified Health</span>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Habitats / Aquascaping Feature */}
      <section className="py-24 md:py-40 relative z-20 w-full bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Image Side */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-linear-to-r from-blue-400 to-cyan-300 rounded-[40px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
              <div className="relative aspect-4/5 rounded-4xl overflow-hidden border border-blue-100 bg-white">
                <img 
                  src="/api/placeholder/800/1000" 
                  alt="Planted Aquarium" 
                  className="w-full h-full object-cover opacity-85 transition-all duration-700 scale-105 group-hover:scale-100"
                />
                {/* Floating UI Element */}
                <div className="absolute bottom-8 -right-8 md:-right-12 bg-white/90 backdrop-blur-xl border border-blue-100 p-6 rounded-3xl w-64 shadow-2xl transform transition-transform group-hover:-translate-y-4 duration-500 hidden sm:block">
                  <div className="flex items-center gap-3 mb-3">
                    <Leaf className="h-5 w-5 text-green-400" />
                    <span className="text-slate-900 font-bold">Zenith Tank V2</span>
                  </div>
                  <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-linear-to-r from-blue-400 to-green-400 w-3/4"></div>
                  </div>
                  <p className="text-xs text-slate-600">Ecosystem stabilization at 75%</p>
                </div>
              </div>
            </div>

            {/* Content Side */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase mb-8">
                <Leaf className="h-3 w-3 text-blue-400" /> Complete Ecosystems
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
                Beyond the <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-300">Glass.</span>
              </h2>
              <p className="text-slate-600 text-lg md:text-xl font-light leading-relaxed mb-10">
                We don't just provide livestock; we build worlds. Our master aquascapers design, construct, and cycle breathtaking aquatic environments that serve as living centerpieces for your home or office.
              </p>
              
              <ul className="space-y-6 mb-12">
                <li className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-900/50 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <span className="text-blue-400 font-bold text-sm">01</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">Bespoke Hardscaping</h4>
                    <p className="text-slate-600 text-sm">Hand-selected Seiryu stone and Malaysian driftwood layouts.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-900/50 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <span className="text-blue-400 font-bold text-sm">02</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">Automated Chemistry</h4>
                    <p className="text-slate-600 text-sm">Integrated smart-dosing and filtration hidden from view.</p>
                  </div>
                </li>
              </ul>

              <button className="h-14 px-8 rounded-full bg-blue-600 text-white flex items-center gap-3 hover:bg-blue-700 transition-all font-bold group">
                Commission a Build 
                <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* NEW: Ultra-Modern Footer */}
      <footer id="contact" className="relative pt-32 pb-10 bg-white border-t border-blue-100 overflow-hidden z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
            
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-6">
                <Waves className="h-8 w-8 text-blue-500" />
                <span className="font-black text-3xl tracking-tighter text-slate-900">
                  NEO<span className="text-blue-500 text-shadow-glow">BLUE</span>
                </span>
              </div>
              <p className="text-slate-600 text-lg font-light max-w-sm mb-8">
                The apex of aquatic commerce. Curating the ocean's finest for the discerning hobbyist.
              </p>
              <div className="flex gap-4">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-white border border-blue-200 rounded-full px-6 py-3 w-full max-w-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors shrink-0">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="md:col-span-2 md:col-start-8">
              <h4 className="text-slate-900 font-bold tracking-wider uppercase text-sm mb-6">Inventory</h4>
              <ul className="space-y-4 text-slate-600 font-light">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Marine Fish</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Freshwater Fish</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Invertebrates</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Live Coral</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-slate-900 font-bold tracking-wider uppercase text-sm mb-6">Company</h4>
              <ul className="space-y-4 text-slate-600 font-light">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Our Ethos</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Quarantine Process</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Journal</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
              </ul>
            </div>

          </div>

          {/* Massive Background Text Effect */}
          <div className="w-full border-t border-blue-100 pt-8 flex flex-col items-center justify-center">
            <h2 className="text-[15vw] md:text-[12rem] font-black tracking-tighter leading-none text-blue-100 select-none pointer-events-none">
              NEOBLUE
            </h2>
            <div className="w-full flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm mt-8">
              <p>© 2026 NeoBlue Aquatics. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Shipping</a>
              </div>
            </div>
          </div>

        </div>
      </footer>

      <MobileDock />

    </div>
  );
}