"use client";
import React from 'react';
import { Leaf, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMode } from '@/lib/hooks/useMode';

export default function ComingSoonPlants() {
  const { setMode } = useMode();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center pb-24 md:pb-12 bg-white">
      <div className="relative w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mb-8 shadow-inner border border-green-100 mt-10">
        <Leaf className="h-12 w-12 text-green-600 animate-pulse" />
        <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-emerald-400 animate-bounce" />
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-green-950 mb-6 tracking-tight">
        Aquatic Plants<br className="hidden md:block" /> Coming Soon
      </h1>
      <p className="text-green-800/80 text-base md:text-lg max-w-md mx-auto leading-relaxed mb-10">
        We are preparing a massive inventory of premium, snail-free aquatic plants and aquascaping materials. Stay tuned!
      </p>
      <button 
        onClick={() => setMode('fishes')}
        className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-green-600 text-white font-bold tracking-wide hover:bg-green-700 transition-colors shadow-md shadow-green-600/20"
      >
        Browse Live Fishes
      </button>
    </div>
  );
}
