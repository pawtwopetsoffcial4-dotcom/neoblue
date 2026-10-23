'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: number; // Size in pixels (default: 64)
  label?: string; // Optional loading text
  className?: string; // Additional classes
}

export default function LoadingSpinner({ size = 64, label, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      <div 
        className="relative flex items-center justify-center select-none" 
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Ambient Soft Glow Behind Spinner */}
        <div className="absolute inset-0 bg-blue-500/15 rounded-full blur-xl scale-125 pointer-events-none animate-pulse" />
        
        {/* High-Performance Vector Dual-Ring Aquatic Spinner */}
        <svg
          className="animate-spin text-blue-600"
          style={{ width: `${size}px`, height: `${size}px` }}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>

        {/* Center Aquatic Pulse Dot */}
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full animate-ping opacity-75" />
      </div>

      {label && (
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 font-sans animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
