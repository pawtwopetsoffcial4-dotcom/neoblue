'use client';

import React from 'react';
import Image from 'next/image';

interface LoadingSpinnerProps {
  size?: number; // Size in pixels (default: 96)
  label?: string; // Optional loading text
  className?: string; // Additional classes
}

export default function LoadingSpinner({ size = 96, label, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      <div 
        className="relative flex items-center justify-center select-none" 
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Ambient Soft Glow Behind Spinner */}
        <div className="absolute inset-0 bg-blue-500/15 rounded-full blur-xl scale-125 pointer-events-none animate-pulse" />
        
        <Image
          src="/loading.gif"
          alt="Loading..."
          fill
          unoptimized
          priority
          className="object-contain drop-shadow-md relative z-10 transition-transform duration-500 hover:scale-105"
        />
      </div>

      {label && (
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 font-sans animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
