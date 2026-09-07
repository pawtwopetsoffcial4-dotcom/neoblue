"use client";

import React from 'react';
import Link from 'next/link';
import { Truck, Sparkles, Zap, Clock, ArrowRight } from 'lucide-react';
import { useMode } from '@/lib/hooks/useMode';

type AnnouncementMarqueeProps = {
  text?: string;
  enabled?: boolean;
  link?: string;
};

export default function AnnouncementMarquee({
  text = 'Next shipping on Monday! Order fast for fastest delivery.',
  enabled = true,
  link = '/products',
}: AnnouncementMarqueeProps) {
  const { mode } = useMode();
  const isFishes = mode === 'fishes';

  if (!enabled || !text?.trim()) {
    return null;
  }

  const marqueeContent = (
    <div className="relative overflow-hidden w-full select-none">
      {/* Background Blue Bar */}
      <div 
        className="w-full py-2.5 px-4 flex items-center transition-all duration-500 shadow-xs border-y bg-blue-600 border-blue-500/40 text-white"
      >
        {/* Continuous Marquee Track */}
        <div className="animate-marquee flex items-center gap-8 text-xs sm:text-sm font-bold tracking-wide">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="flex items-center gap-6 shrink-0">
              {/* Badge & Icon */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-2xs bg-blue-950/60 text-cyan-300 border border-cyan-400/30">
                  <Truck className="w-3 h-3 animate-pulse text-amber-300" />
                  <span>Dispatch Alert</span>
                </span>
                <span className="font-extrabold text-white text-xs sm:text-sm drop-shadow-xs">
                  {text}
                </span>
              </div>

              {/* Sparkle Separator */}
              <div className="flex items-center gap-2 opacity-60">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] uppercase tracking-widest font-semibold opacity-80">
                  Live-Arrival Guaranteed
                </span>
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (link && link.trim()) {
    return (
      <Link href={link} className="block group cursor-pointer" aria-label="Announcement">
        {marqueeContent}
      </Link>
    );
  }

  return marqueeContent;
}
