"use client";
import React from 'react';
import ReviewStars from './ReviewStars';

type Review = {
  id: string | number;
  user: string;
  rating: number;
  date?: string;
  comment?: string;
  avatar?: string | null;
  verified?: boolean;
};

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (!reviews || reviews.length === 0) {
    return <div className="text-slate-500">No reviews yet — be the first to leave one.</div>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <article key={r.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
              {r.avatar || r.user?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.user}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <ReviewStars rating={r.rating} compact size={12} />
                    <span className="text-[11px] text-slate-400">{r.date}</span>
                    {r.verified && <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Verified</span>}
                  </div>
                </div>
              </div>
              {r.comment && <p className="mt-3 text-slate-600 text-sm leading-relaxed">{r.comment}</p>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
