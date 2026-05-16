"use client";
import React from 'react';
import { Star } from 'lucide-react';

type Props = {
  rating?: number; // may be fractional, e.g. 4.3
  count?: number;
  compact?: boolean;
  size?: number; // px
};

export default function ReviewStars({ rating = 0, count, compact = false, size = 14 }: Props) {
  const safe = Math.max(0, Math.min(5, rating));
  const full = Math.floor(safe);
  const frac = Math.round((safe - full) * 10) / 10; // one decimal

  return (
    <div className={`inline-flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-sm'}`}>
      <div className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => {
          const key = `star-${i}`;
          if (i < full) {
            return (
              <Star key={key} className="text-amber-400" style={{ width: size, height: size }} />
            );
          }

          if (i === full && frac > 0) {
            return (
              <span key={key} className="relative inline-block" style={{ width: size, height: size }}>
                <Star className="text-amber-400 absolute left-0 top-0 overflow-hidden" style={{ width: size, height: size, clipPath: `inset(0 ${100 - frac * 100}% 0 0)` }} />
                <Star className="text-slate-200" style={{ width: size, height: size }} />
              </span>
            );
          }

          return <Star key={key} className="text-slate-200" style={{ width: size, height: size }} />;
        })}
      </div>

      {typeof rating === 'number' && (
        <span className={`font-semibold ${compact ? 'text-[11px]' : 'text-sm'}`}>
          {rating.toFixed(1)}
        </span>
      )}

      {typeof count === 'number' && (
        <span className={`text-slate-400 ${compact ? 'text-[11px]' : 'text-sm'}`}>• {count}</span>
      )}
    </div>
  );
}
