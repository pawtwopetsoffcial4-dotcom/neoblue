"use client";

import React, { useEffect, useMemo, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, Heart, X, SlidersHorizontal, ArrowUpDown, 
  Star, ArrowDown, ShieldCheck, Truck, Headset,
  History, Sparkles, TrendingUp, ArrowRight, CornerDownLeft,
  Command, Tag, Droplets, Leaf, Fish, Check, RotateCcw, AlertCircle
} from 'lucide-react';
import ReviewStars from '@/app/components/ReviewStars';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { useCart } from '@/lib/hooks/useCart';
import ProductCard from '@/app/components/ProductCard';
import { getSubcategoriesForCategory } from '@/lib/catalog';
import { useMode } from '@/lib/hooks/useMode';

const formatPrice = (price: number) => `₹${price}`;

const DEFAULT_IMAGE = 'https://images.stockcake.com/public/1/9/4/194f4315-a8d9-422b-b237-18b1e224b7a1_large/colorful-tropical-fish-stockcake.jpg';

const RECENT_SEARCHES_KEY = 'neoblue_recent_searches';

const SYNONYMS: Record<string, string[]> = {
  guppy: ['guppies', 'guppy', 'poecilia', 'fancy guppy'],
  guppies: ['guppy', 'poecilia', 'fancy guppy'],
  betta: ['bettas', 'siamese fighting fish', 'fighter', 'plakat', 'halfmoon'],
  bettas: ['betta', 'siamese fighting fish', 'fighter', 'plakat', 'halfmoon'],
  tetra: ['tetras', 'neon', 'cardinal', 'characin', 'rummynose', 'ember'],
  tetras: ['tetra', 'neon', 'cardinal', 'characin', 'rummynose', 'ember'],
  cichlid: ['cichlids', 'apisto', 'apistogramma', 'angelfish', 'discus', 'ram'],
  cichlids: ['cichlid', 'apisto', 'apistogramma', 'angelfish', 'discus', 'ram'],
  shrimp: ['shrimps', 'neocaridina', 'caridina', 'amano', 'cherry shrimp'],
  shrimps: ['shrimp', 'neocaridina', 'caridina', 'amano', 'cherry shrimp'],
  snail: ['snails', 'nerite', 'mystery snail', 'apple snail', 'ramshorn'],
  snails: ['snail', 'nerite', 'mystery snail', 'apple snail', 'ramshorn'],
  plant: ['plants', 'flora', 'aquascaping', 'moss', 'stem', 'rhizome'],
  plants: ['plant', 'flora', 'aquascaping', 'moss', 'stem', 'rhizome'],
  anubias: ['anubia', 'nana', 'petite'],
  anubia: ['anubias', 'nana', 'petite'],
  moss: ['java moss', 'christmas moss', 'flame moss', 'taiwan moss', 'phoenix moss'],
  freshwater: ['fresh', 'fresh water', 'sweetwater'],
  saltwater: ['marine', 'salt water', 'reef', 'ocean', 'sea'],
  marine: ['saltwater', 'salt water', 'reef'],
  hardy: ['easy', 'beginner', 'low maintenance', 'robust'],
  easy: ['hardy', 'beginner', 'low maintenance', 'simple'],
  peaceful: ['community', 'friendly', 'calm', 'gentle', 'non-aggressive'],
  aggressive: ['territorial', 'semi-aggressive', 'predator'],
  small: ['nano', 'tiny', 'mini', 'dwarf'],
  nano: ['small', 'tiny', 'mini', 'dwarf'],
};

// Levenshtein distance calculation for typo tolerance
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 3;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function wordFuzzyMatch(queryWord: string, targetText: string): boolean {
  if (!queryWord || !targetText) return false;
  const lowerTarget = targetText.toLowerCase();
  if (lowerTarget.includes(queryWord)) return true;
  
  const targetWords = lowerTarget.split(/[\s,_\-/()]+/);
  for (const tw of targetWords) {
    if (!tw) continue;
    if (tw.startsWith(queryWord) || queryWord.startsWith(tw)) return true;
    if (queryWord.length >= 3 && tw.length >= 3) {
      const maxAllowedDist = queryWord.length >= 6 ? 2 : 1;
      if (levenshteinDistance(queryWord, tw) <= maxAllowedDist) return true;
    }
  }
  return false;
}

// Pro Max scoring engine
function scoreProduct(product: MarketplaceProduct, query: string): number {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return 1;

  const tokens = cleanQuery.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) return 1;

  let totalScore = 0;

  const title = (product.title || '').toLowerCase();
  const scientific = (product.scientific || '').toLowerCase();
  const tag = (product.tag || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const subcategory = (product.subcategory || '').toLowerCase();
  const waterType = (product.waterType || '').toLowerCase();
  const temperament = ((product as any).temperament || '').toLowerCase();
  const careDifficulty = ((product as any).careDifficulty || '').toLowerCase();
  const size = (product.size || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const lighting = ((product as any).lightingRequirement || '').toLowerCase();
  const co2 = ((product as any).co2Requirement || '').toLowerCase();
  const placement = ((product as any).placement || '').toLowerCase();

  // Full exact phrase bonus
  if (title === cleanQuery) totalScore += 500;
  else if (title.startsWith(cleanQuery)) totalScore += 300;
  else if (title.includes(cleanQuery)) totalScore += 180;

  for (const token of tokens) {
    let tokenMatched = false;
    let tokenScore = 0;

    const variations = [token, ...(SYNONYMS[token] || [])];

    for (const v of variations) {
      // Title
      if (title.includes(v)) {
        tokenScore += (title.startsWith(v) ? 120 : 80);
        tokenMatched = true;
      } else if (wordFuzzyMatch(v, title)) {
        tokenScore += 45;
        tokenMatched = true;
      }

      // Scientific Name
      if (scientific.includes(v)) {
        tokenScore += 90;
        tokenMatched = true;
      } else if (wordFuzzyMatch(v, scientific)) {
        tokenScore += 40;
        tokenMatched = true;
      }

      // Tag & Category
      if (tag.includes(v)) {
        tokenScore += 70;
        tokenMatched = true;
      }
      if (category.includes(v) || subcategory.includes(v)) {
        tokenScore += 60;
        tokenMatched = true;
      }

      // Water Type
      if (waterType.includes(v) || (v === 'fresh' && waterType === 'freshwater') || (v === 'salt' && waterType === 'saltwater')) {
        tokenScore += 75;
        tokenMatched = true;
      }

      // Care / Temperament / Plants Specs
      if (temperament.includes(v) || careDifficulty.includes(v)) {
        tokenScore += 50;
        tokenMatched = true;
      }
      if (lighting.includes(v) || co2.includes(v) || placement.includes(v)) {
        tokenScore += 50;
        tokenMatched = true;
      }
      if (size.includes(v)) {
        tokenScore += 40;
        tokenMatched = true;
      }

      // Description
      if (description.includes(v)) {
        tokenScore += 25;
        tokenMatched = true;
      }
    }

    if (!tokenMatched) {
      return 0;
    }

    totalScore += tokenScore;
  }

  return totalScore;
}

// Helper to highlight matched query substring
function highlightText(text: string, query: string) {
  if (!query || !query.trim() || !text) return text;
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return text;

  const regex = new RegExp(`(${tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-amber-200 text-slate-900 rounded-xs px-0.5 font-bold">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const extractProducts = (payload: unknown): MarketplaceProduct[] => {
  if (Array.isArray(payload)) return payload as MarketplaceProduct[];
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as { products?: unknown; data?: { products?: unknown } };
  if (Array.isArray(data.products)) return data.products as MarketplaceProduct[];
  if (Array.isArray(data.data?.products)) return data.data.products as MarketplaceProduct[];
  return [];
};

function ProductsPageContent() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { mode } = useMode();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || '';

  useEffect(() => {
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [urlSearchTerm]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 6));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, queryToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== queryToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const clearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (err) {
      console.error(err);
    }
  };

  // Keyboard shortcut listener (/ or Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === 'Escape' && isSearchFocused) {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused]);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter & Sorting state
  const [sortBy, setSortBy] = useState('featured');
  const [category, setCategory] = useState('All');
  const [subcategory, setSubcategory] = useState('All');
  const [waterType, setWaterType] = useState('All');
  const [tag, setTag] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [lightingRequirement, setLightingRequirement] = useState('All');
  const [co2Requirement, setCo2Requirement] = useState('All');
  const [placement, setPlacement] = useState('All');
  const [careDifficulty, setCareDifficulty] = useState('All');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [wishlistedIds, setWishlistedIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('neoblue_wishlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlistedIds(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleWishlist = (productId: string) => {
    setWishlistedIds((current) => {
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      localStorage.setItem('neoblue_wishlist', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    document.title = mode === 'fishes' ? "Fishes & Live Stock | NeoBlue" : "Aquarium Plants & Moss | NeoBlue";
  }, [mode]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      setProducts(extractProducts(data));
    } catch {
      setProducts([]);
      setLoadError(mode === 'fishes' ? 'Unable to load fishes right now. Please try again.' : 'Unable to load plants right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        setAvailableCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        setAvailableCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Reset category filters on mode change
  useEffect(() => {
    setCategory('All');
    setSubcategory('All');
  }, [mode]);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('featured');
    setCategory('All');
    setSubcategory('All');
    setWaterType('All');
    setTag('All');
    setInStockOnly(false);
    setLightingRequirement('All');
    setCo2Requirement('All');
    setPlacement('All');
    setCareDifficulty('All');
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    category !== 'All' ||
    subcategory !== 'All' ||
    waterType !== 'All' ||
    tag !== 'All' ||
    inStockOnly ||
    lightingRequirement !== 'All' ||
    co2Requirement !== 'All' ||
    placement !== 'All' ||
    careDifficulty !== 'All'
  );

  // Trending / quick tags per mode
  const trendingChips = useMemo(() => {
    return mode === 'fishes'
      ? ['Betta', 'Guppy', 'Neon Tetra', 'Discus', 'Freshwater', 'Shrimp', 'Peaceful', 'Nano']
      : ['Anubias', 'Java Fern', 'Carpeting', 'Low Light', 'Foreground', 'No CO2', 'Moss', 'Hardy'];
  }, [mode]);

  // Dynamically compute filters depending on active mode
  const categoriesList = useMemo(() => {
    const rawCategories = Array.from(new Set([...availableCategories, ...products.map((p) => p.category)]));
    if (mode === 'fishes') {
      return ['All', ...rawCategories.filter((cat) => cat !== 'Plants')];
    } else {
      return ['All', ...rawCategories.filter((cat) => cat === 'Plants')];
    }
  }, [availableCategories, products, mode]);

  const subcategoriesList = useMemo(() => {
    if (category === 'All') {
      if (mode === 'plants') {
        return ['All', ...getSubcategoriesForCategory('Plants')];
      }
      return ['All'];
    }
    return ['All', ...getSubcategoriesForCategory(category)];
  }, [category, mode]);

  const waterTypesList = useMemo(() => {
    const subset = products.filter((p) => mode === 'fishes' ? p.category !== 'Plants' : p.category === 'Plants');
    return ['All', ...Array.from(new Set(subset.map((p) => p.waterType)))];
  }, [products, mode]);

  const tagsList = useMemo(() => {
    const subset = products.filter((p) => mode === 'fishes' ? p.category !== 'Plants' : p.category === 'Plants');
    return ['All', ...Array.from(new Set(subset.map((p) => p.tag).filter(Boolean)))];
  }, [products, mode]);

  // Scored and Filtered Products
  const { filteredProducts, topSearchPreviews, didYouMeanSuggestion } = useMemo(() => {
    const query = searchTerm.trim();
    
    // 1. Isolate by active mode first
    const modeProducts = products.filter((product) => {
      if (mode === 'fishes' && product.category === 'Plants') return false;
      if (mode === 'plants' && product.category !== 'Plants') return false;
      return true;
    });

    // 2. Score search matches
    const scoredList: { product: MarketplaceProduct; score: number }[] = [];
    for (const p of modeProducts) {
      const score = scoreProduct(p, query);
      if (score > 0) {
        scoredList.push({ product: p, score });
      }
    }

    // Top 4 preview matches for autocomplete
    const topPreviews = query ? [...scoredList].sort((a, b) => b.score - a.score).slice(0, 4).map(item => item.product) : [];

    // 3. Apply standard faceted filters
    const finalFiltered = scoredList
      .filter(({ product }) => {
        const matchesCategory = category === 'All' || product.category === category;
        const matchesSubcategory = subcategory === 'All' || !subcategory || product.subcategory === subcategory;
        const matchesWaterType = waterType === 'All' || product.waterType === waterType;
        const matchesTag = tag === 'All' || (product.tag ?? '') === tag;
        const matchesStock = !inStockOnly || product.inStock;
        
        const matchesLighting = lightingRequirement === 'All' || (product as any).lightingRequirement === lightingRequirement;
        const matchesCo2 = co2Requirement === 'All' || (product as any).co2Requirement === co2Requirement;
        const matchesPlacement = placement === 'All' || (product as any).placement === placement;
        const matchesDifficulty = careDifficulty === 'All' || (product as any).careDifficulty === careDifficulty;

        return matchesCategory && matchesSubcategory && matchesWaterType && matchesTag && matchesStock && matchesLighting && matchesCo2 && matchesPlacement && matchesDifficulty;
      })
      .sort((a, b) => {
        // If searching with active query and default sort, prioritize search relevance!
        if (query && sortBy === 'featured') {
          return b.score - a.score;
        }

        switch (sortBy) {
          case 'price-asc': return a.product.price - b.product.price;
          case 'price-desc': return b.product.price - a.product.price;
          case 'name-asc': return a.product.title.localeCompare(b.product.title);
          case 'rating-desc': return (Number(b.product.rating) || 0) - (Number(a.product.rating) || 0);
          default: return (Number(b.product.rating) || 0) - (Number(a.product.rating) || 0);
        }
      })
      .map(item => item.product);

    // 4. Calculate "Did you mean" suggestion if no results found
    let suggestion: string | null = null;
    if (query && finalFiltered.length === 0) {
      let closestDist = Infinity;
      let closestName = '';
      const pool = Array.from(new Set([
        ...modeProducts.map(p => p.title),
        ...modeProducts.map(p => p.category),
        ...modeProducts.map(p => p.tag).filter(Boolean) as string[],
        ...trendingChips
      ]));

      const queryLower = query.toLowerCase();
      for (const candidate of pool) {
        const candLower = candidate.toLowerCase();
        const dist = levenshteinDistance(queryLower, candLower);
        if (dist < closestDist && dist <= 3 && candLower !== queryLower) {
          closestDist = dist;
          closestName = candidate;
        }
      }
      if (closestName) {
        suggestion = closestName;
      }
    }

    return {
      filteredProducts: finalFiltered,
      topSearchPreviews: topPreviews,
      didYouMeanSuggestion: suggestion,
    };
  }, [products, searchTerm, category, subcategory, waterType, tag, inStockOnly, sortBy, mode, lightingRequirement, co2Requirement, placement, careDifficulty, trendingChips]);

  // Recommended products for zero-state rescue
  const recommendedRescueProducts = useMemo(() => {
    const modeProducts = products.filter((product) => {
      if (mode === 'fishes' && product.category === 'Plants') return false;
      if (mode === 'plants' && product.category !== 'Plants') return false;
      return true;
    });
    return modeProducts.slice(0, 4);
  }, [products, mode]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchFocused(false);
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm.trim());
    }
  };

  const handleSelectQuickChip = (chip: string) => {
    setSearchTerm(chip);
    saveRecentSearch(chip);
    setIsSearchFocused(false);
  };

  return (
    <div className={`min-h-screen pb-safe pb-24 font-sans w-full overflow-x-hidden transition-colors duration-500 ${mode === 'fishes' ? 'bg-[#f5f6f8] selection:bg-blue-200' : 'bg-[#f5f8f6] selection:bg-green-200'} text-slate-900`}>
      
      {/* Floating Glassmorphism Filters Capsule */}
      <div className="fixed bottom-[98px] md:bottom-8 left-1/2 -translate-x-1/2 z-[1050] animate-fade-in-up">
        <button
          onClick={() => setFilterModalOpen(true)}
          style={{
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            backdropFilter: 'blur(20px) saturate(180%)',
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/80 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1.5px_rgba(255,255,255,1)] text-slate-900 font-black text-xs tracking-wide transition-all active:scale-95 hover:bg-white/80 cursor-pointer ${
            mode === 'fishes' ? 'hover:shadow-blue-500/15' : 'hover:shadow-emerald-500/15'
          }`}
        >
          <SlidersHorizontal className={`h-4 w-4 ${mode === 'fishes' ? 'text-blue-700' : 'text-emerald-800'}`} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className={`w-2 h-2 rounded-full ${mode === 'fishes' ? 'bg-blue-600' : 'bg-emerald-600'} animate-pulse`} />
          )}
        </button>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-0 pb-28">
        
        {/* Pro Max Search Bar & Smart Interactive Dropdown */}
        <div ref={searchContainerRef} className="z-40 w-full pt-3 mb-6 relative">
          <div className="max-w-3xl mx-auto relative">
            
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className={`absolute left-4.5 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors duration-300 z-10 ${
                isSearchFocused 
                  ? (mode === 'fishes' ? 'text-blue-600' : 'text-emerald-600') 
                  : 'text-slate-400'
              }`} />
              
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                style={{
                  WebkitBackdropFilter: 'blur(24px) saturate(190%)',
                  backdropFilter: 'blur(24px) saturate(190%)',
                }}
                placeholder={mode === 'fishes' ? "Search by species, common name, temperament, tags..." : "Search plants, placement, light/CO2, moss..."}
                className={`w-full h-[52px] rounded-2xl border bg-white/80 pl-12 pr-28 text-sm md:text-base font-semibold text-slate-900 shadow-[0_10px_35px_rgba(0,0,0,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] outline-none placeholder:text-slate-400 transition-all duration-300 ${
                  isSearchFocused
                    ? (mode === 'fishes' 
                        ? 'border-blue-500/80 bg-white ring-4 ring-blue-500/15 shadow-blue-500/10' 
                        : 'border-emerald-500/80 bg-white ring-4 ring-emerald-500/15 shadow-emerald-500/10')
                    : 'border-white/90 hover:border-slate-300 hover:bg-white/90'
                }`}
              />

              {/* Clear Button & Keyboard Shortcut Hint */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-[10px] font-bold text-slate-500 select-none">
                  <Command className="h-2.5 w-2.5" />
                  <span>K</span>
                </div>
              </div>
            </form>

            {/* Smart Autocomplete Dropdown Overlay */}
            {isSearchFocused && (
              <div 
                style={{
                  WebkitBackdropFilter: 'blur(20px)',
                  backdropFilter: 'blur(20px)',
                }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/95 rounded-2xl border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                
                {/* Trending / Quick Suggestion Chips */}
                <div className="p-4 border-b border-slate-100/80 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                      Popular {mode === 'fishes' ? 'Aquatic Searches' : 'Plant Searches'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSelectQuickChip(chip)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          mode === 'fishes'
                            ? 'bg-white hover:bg-blue-50 border-slate-200/80 hover:border-blue-300 text-slate-700 hover:text-blue-700'
                            : 'bg-white hover:bg-emerald-50 border-slate-200/80 hover:border-emerald-300 text-slate-700 hover:text-emerald-700'
                        }`}
                      >
                        <Sparkles className="h-3 w-3 opacity-60" />
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Searches */}
                {recentSearches.length > 0 && !searchTerm.trim() && (
                  <div className="p-4 border-b border-slate-100/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5 text-slate-400" />
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={clearAllRecentSearches}
                        className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Clear History
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((item) => (
                        <div
                          key={item}
                          onClick={() => handleSelectQuickChip(item)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <History className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
                            <span>{item}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => removeRecentSearch(e, item)}
                            className="text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove item"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Search Instant Matches (Top Previews) */}
                {searchTerm.trim() && topSearchPreviews.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Fish className="h-3.5 w-3.5 text-blue-500" />
                        Instant Matches ({filteredProducts.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {topSearchPreviews.map((p) => (
                        <Link
                          key={p._id}
                          href={`/products/${p._id || (p as any).id}`}
                          onClick={() => {
                            saveRecentSearch(searchTerm);
                            setIsSearchFocused(false);
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group cursor-pointer"
                        >
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <Image
                              src={p.images?.[0] || (p as any).img || DEFAULT_IMAGE}
                              alt={p.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700">
                              {highlightText(p.title, searchTerm)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-black text-slate-900">
                                {formatPrice(p.price)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {p.waterType || p.category}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mr-1" />
                        </Link>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className={`w-full mt-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        mode === 'fishes'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      <span>View all {filteredProducts.length} results for &ldquo;{searchTerm}&rdquo;</span>
                      <CornerDownLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {searchTerm.trim() && topSearchPreviews.length === 0 && (
                  <div className="p-6 text-center">
                    <AlertCircle className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No instant results found for &ldquo;{searchTerm}&rdquo;</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Press Enter to run a deep scan or explore categories.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Search & Filters Pill Bar */}
          {hasActiveFilters && (
            <div className="max-w-3xl mx-auto mt-3 flex flex-wrap items-center gap-2 animate-fade-in">
              <span className="text-xs font-bold text-slate-500 mr-1">
                Showing <strong className="text-slate-900">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>

              {searchTerm.trim() && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                  mode === 'fishes' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <Search className="h-3 w-3" />
                  &ldquo;{searchTerm}&rdquo;
                  <button onClick={() => setSearchTerm('')} className="hover:opacity-75 cursor-pointer ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {category !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-800">
                  {category}
                  <button onClick={() => { setCategory('All'); setSubcategory('All'); }} className="hover:opacity-75 cursor-pointer ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {subcategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-800">
                  {subcategory}
                  <button onClick={() => setSubcategory('All')} className="hover:opacity-75 cursor-pointer ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {waterType !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 border border-cyan-200 text-cyan-800">
                  <Droplets className="h-3 w-3" /> {waterType}
                  <button onClick={() => setWaterType('All')} className="hover:opacity-75 cursor-pointer ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {tag !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 border border-purple-200 text-purple-800">
                  <Tag className="h-3 w-3" /> {tag}
                  <button onClick={() => setTag('All')} className="hover:opacity-75 cursor-pointer ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                  In Stock Only
                  <button onClick={() => setInStockOnly(false)} className="hover:opacity-75 cursor-pointer ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-500 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Reset All
              </button>
            </div>
          )}
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-24 flex justify-center">
            <LoadingSpinner size={48} label={mode === 'fishes' ? "Loading Fishes..." : "Loading Plants..."} />
          </div>
        )}

        {!isLoading && loadError && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-rose-500 mb-4">{loadError}</p>
            <button 
              onClick={fetchProducts} 
              className={`h-10 rounded-full px-6 text-sm font-bold text-white transition-colors ${
                mode === 'fishes' ? 'bg-[#064ee5] hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Zero Results Rescue System */}
        {!isLoading && !loadError && filteredProducts.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center px-4 max-w-xl mx-auto animate-fade-in">
            <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
              <Search className={`h-8 w-8 ${mode === 'fishes' ? 'text-blue-500' : 'text-emerald-500'}`} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
              No {mode === 'fishes' ? 'fishes' : 'plants'} found
              {searchTerm && <span> for &ldquo;{searchTerm}&rdquo;</span>}
            </h3>
            
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
              We couldn&apos;t find an exact match for your search criteria. Try a suggestion below or reset your filters.
            </p>

            {/* Did you mean recommendation */}
            {didYouMeanSuggestion && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 w-full flex items-center justify-between gap-3 text-left">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Did you mean?</p>
                  <p className="text-sm font-black text-amber-950 mt-0.5">{didYouMeanSuggestion}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSearchTerm(didYouMeanSuggestion); saveRecentSearch(didYouMeanSuggestion); }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-colors cursor-pointer shrink-0"
                >
                  Search &ldquo;{didYouMeanSuggestion}&rdquo;
                </button>
              </div>
            )}

            {/* Popular quick searches */}
            <div className="mb-8 w-full">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Popular Searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {trendingChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSelectQuickChip(chip)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 hover:border-slate-400 transition-all cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className={`h-11 rounded-full px-8 text-xs font-black uppercase tracking-wider text-white transition-all shadow-md cursor-pointer ${
                mode === 'fishes' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              Reset All Filters
            </button>

            {/* Recommended Products Carousel / Grid */}
            {recommendedRescueProducts.length > 0 && (
              <div className="w-full mt-14 pt-10 border-t border-slate-200/80 text-left">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
                  Recommended {mode === 'fishes' ? 'Livestock' : 'Plants'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                  {recommendedRescueProducts.map((p, idx) => (
                    <ProductCard key={p._id} product={p} idx={idx} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Responsive Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 mb-12">
              {filteredProducts.map((product, idx) => {
                return <ProductCard key={product._id} product={product} idx={idx} />;
              })}
            </div>
          </>
        )}
      </main>

      {/* Unified Filter & Sort Modal / Bottom Sheet */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:justify-center items-center bg-slate-900/60 backdrop-blur-sm transition-opacity p-0 md:p-6">
          <div className="absolute inset-0 w-full h-full" onClick={() => setFilterModalOpen(false)} />
          
          <div className="relative w-full md:max-w-xl flex flex-col max-h-[85vh] md:max-h-[80vh] rounded-t-3xl md:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 shrink-0 overflow-hidden">
            <div className="flex md:hidden justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-slate-200" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Filter & Sort</h2>
              <button 
                onClick={() => setFilterModalOpen(false)} 
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              <div className="space-y-4">
                {/* Sort */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Sort By</label>
                  <select 
                    className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 ${
                      mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                    }`} 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating-desc">Top Rated</option>
                    <option value="name-asc">Name: A to Z</option>
                  </select>
                </div>
                
                {/* Categories */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
                    <select 
                      className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 ${
                        mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                      }`} 
                      value={category} 
                      onChange={(e) => { setCategory(e.target.value); setSubcategory('All'); }}
                    >
                      {categoriesList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Subcategory</label>
                    <select 
                      className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 disabled:opacity-50 ${
                        mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                      }`} 
                      value={subcategory} 
                      onChange={(e) => setSubcategory(e.target.value)} 
                      disabled={category === 'All'}
                    >
                      {subcategoriesList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Water Type</label>
                    <select 
                      className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 ${
                        mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                      }`} 
                      value={waterType} 
                      onChange={(e) => setWaterType(e.target.value)}
                    >
                      {waterTypesList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tag</label>
                    <select 
                      className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 ${
                        mode === 'fishes' ? 'focus:border-[#064ee5] focus:ring-[#064ee5]' : 'focus:border-green-600 focus:ring-green-600'
                      }`} 
                      value={tag} 
                      onChange={(e) => setTag(e.target.value)}
                    >
                      {tagsList.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>

                {/* Plant Filters */}
                {mode === 'plants' && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Lighting</label>
                      <select 
                        className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:border-green-600 focus:ring-green-600`}
                        value={lightingRequirement} 
                        onChange={(e) => setLightingRequirement(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">CO2</label>
                      <select 
                        className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:border-green-600 focus:ring-green-600`}
                        value={co2Requirement} 
                        onChange={(e) => setCo2Requirement(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="None">None</option>
                        <option value="Recommended">Recommended</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Placement</label>
                      <select 
                        className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:border-green-600 focus:ring-green-600`}
                        value={placement} 
                        onChange={(e) => setPlacement(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Foreground">Foreground</option>
                        <option value="Midground">Midground</option>
                        <option value="Background">Background</option>
                        <option value="Floating">Floating</option>
                        <option value="Epiphyte">Epiphyte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Difficulty</label>
                      <select 
                        className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:border-green-600 focus:ring-green-600`}
                        value={careDifficulty} 
                        onChange={(e) => setCareDifficulty(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Easy">Easy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Switch */}
                <div className="pt-2">
                  <label className="flex items-center justify-between cursor-pointer rounded-xl border border-slate-200 p-3.5 active:bg-slate-50">
                    <span className="text-sm font-bold text-slate-900">In-stock only</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inStockOnly}
                      onClick={() => setInStockOnly((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        inStockOnly ? (mode === 'fishes' ? 'bg-[#064ee5]' : 'bg-green-600') : 'bg-slate-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inStockOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-5 py-4 bg-white pb-safe">
              <button 
                type="button" 
                onClick={clearFilters} 
                className="flex-1 h-11 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-900 active:bg-slate-50"
              >
                Clear All
              </button>
              <button 
                type="button" 
                onClick={() => setFilterModalOpen(false)} 
                className={`flex-2 h-11 rounded-full text-sm font-bold text-white transition-colors ${
                  mode === 'fishes' ? 'bg-[#064ee5] hover:bg-blue-750' : 'bg-green-600 hover:bg-green-750'
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}