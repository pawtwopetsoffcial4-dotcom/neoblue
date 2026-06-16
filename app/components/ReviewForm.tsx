"use client";
import React, { useState, useEffect } from 'react';
import ReviewStars from './ReviewStars';
import { useAuth } from '@/lib/hooks/useAuth';

type Props = {
  productId: string;
  onSubmit?: () => void;
};

export default function ReviewForm({ productId, onSubmit }: Props) {
  const { token, user: authUser } = useAuth();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authUser?.name) {
      setName(authUser.name);
    }
  }, [authUser]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!token) {
      return setError('You must be logged in to submit a review.');
    }
    if (!name.trim()) return setError('Please enter your name.');
    if (rating < 1 || rating > 5) return setError('Please provide a rating.');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${productId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user: name.trim(), rating, comment: comment.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to submit review');
      }

      setSuccess('Thanks — your review was submitted.');
      setName('');
      setComment('');
      setRating(5);
      onSubmit && onSubmit();
    } catch (err: any) {
      setError(err?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {success && <div className="text-emerald-700 font-semibold">{success}</div>}
      {error && <div className="text-rose-600 font-medium">{error}</div>}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Your rating</label>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => {
              const idx = i + 1;
              return (
                <button
                  key={idx}
                  type="button"
                  onMouseEnter={() => setHover(idx)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setRating(idx)}
                  className={`p-1 rounded transition-transform ${hover && idx <= (hover || 0) ? 'scale-110' : ''}`}
                  aria-label={`${idx} star`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={idx <= (hover ?? rating) ? '#f59e0b' : 'none'} stroke={idx <= (hover ?? rating) ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                    <path d="M12 .587l3.668 7.431 8.21 1.192-5.938 5.788 1.402 8.168L12 18.896l-7.342 3.87 1.402-8.168L.122 9.21l8.21-1.192z" />
                  </svg>
                </button>
              );
            })}
          </div>
          <div className="ml-3 text-sm text-slate-600">{rating.toFixed(1)} / 5</div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none" placeholder="e.g. Anika" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Your review</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none" placeholder="Share your experience (shipping, acclimation, colors)..." />
      </div>

      <div className="flex items-center gap-3">
        <button disabled={submitting} type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-60">
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <button type="button" onClick={() => { setName(''); setComment(''); setRating(5); }} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Reset</button>
      </div>
    </form>
  );
}
