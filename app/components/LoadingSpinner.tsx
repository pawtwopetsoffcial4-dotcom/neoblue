'use client';

import React from 'react';
import Image from 'next/image';

interface LoadingSpinnerProps {
  size?: number; // Size in pixels
  label?: string; // Optional loading text
  className?: string; // Additional classes
}

export default function LoadingSpinner({ size = 48, label, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className="relative" 
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <Image
          src="/loading.gif"
          alt="Loading..."
          fill
          unoptimized
          className="object-contain"
        />
      </div>
      {label && (
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-sans">
          {label}
        </p>
      )}
    </div>
  );
}
