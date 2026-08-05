import { Star } from 'lucide-react';
'use client';

import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useMode } from '@/lib/hooks/useMode';

interface Comment {
  _id: string;
  author: string;
  content: string;
  rating: number;
  isApproved: boolean;
  createdAt: string;
}

interface BlogCommentsProps {
  blogId: string;
}

export default function BlogComments({ blogId }: BlogCommentsProps) {
  const { mode } = useMode();
  const isPlants = mode === 'plants';

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    author: '',
    email: '',
    content: '',
    rating: 5,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blogs/${blogId}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  // Load comments on mount and when blogId changes
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit comment');
      } else {
        setSuccess(true);
        setFormData({ author: '', email: '', content: '', rating: 5 });
        setShowForm(false);
        // Reload comments
        loadComments();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  const accentColorClass = isPlants ? 'text-emerald-600' : 'text-blue-600';
  const buttonBgClass = isPlants ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10';
  const focusRingClass = isPlants ? 'focus:ring-emerald-500/20 focus:border-emerald-600' : 'focus:ring-blue-500/20 focus:border-blue-600';
  const ratingStarColor = isPlants ? 'text-emerald-500' : 'text-blue-500';

  return (
    <section className="mt-16 max-w-3xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Comments <span className={`text-lg font-bold ml-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500`}>{comments.length}</span>
        </h2>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl ${buttonBgClass} transition-all duration-300 hover:shadow-lg cursor-pointer`}
          >
            Add Comment
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in-up">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your comment has been submitted and will appear after admin approval.
        </div>
      )}

      {/* Comment Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner animate-fade-in-up"
        >
          <h3 className="text-base font-bold text-slate-900 mb-4">Post your comment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Name *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Your name"
                required
                minLength={2}
                className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-4 ${focusRingClass} bg-white transition-all`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-4 ${focusRingClass} bg-white transition-all`}
              />
            </div>
          </div>

          {/* Star Rating Selection */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                  className={`text-2xl transform active:scale-95 hover:scale-115 transition-transform duration-200 cursor-pointer ${
                    star <= formData.rating
                      ? 'text-yellow-400'
                      : 'text-slate-300 hover:text-yellow-300'
                  }`}
                >
                  <Star className="w-3 h-3 inline fill-amber-400 text-amber-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Comment *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Share your thoughts or ask a question..."
              required
              minLength={3}
              maxLength={2000}
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-4 ${focusRingClass} bg-white resize-none transition-all`}
            />
            <div className="text-2xs text-slate-400 font-semibold mt-1.5 flex justify-end">
              {formData.content.length} / 2000 characters
            </div>
          </div>

          {/* Form Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl ${buttonBgClass} transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer`}
            >
              {submitting ? 'Submitting...' : 'Submit Comment'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 text-sm font-bold bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size={36} label="Loading Comments..." />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-5 animate-fade-in-up">
          {comments.map((comment) => {
            const date = new Date(comment.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            
            // Generate initials placeholder
            const initial = comment.author.trim().charAt(0).toUpperCase() || 'U';

            return (
              <div 
                key={comment._id} 
                className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-white/70 shadow-2xs hover:shadow-sm transition-all"
              >
                {/* Initial Avatar */}
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white ${
                  isPlants ? 'bg-emerald-600' : 'bg-blue-600'
                }`}>
                  {initial}
                </div>

                {/* Comment Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2.5">
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none">{comment.author}</p>
                      <p className="text-3xs text-slate-400 font-semibold mt-1">{date}</p>
                    </div>
                    <div className="flex gap-0.5 mt-1 sm:mt-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= comment.rating
                              ? 'text-yellow-400'
                              : 'text-slate-200'
                          }`}
                        >
                          <Star className="w-3 h-3 inline fill-amber-400 text-amber-400" />
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed break-words whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50/20 border border-dashed border-slate-200 rounded-2xl animate-fade-in-up">
          <p className="text-slate-400 text-sm font-semibold">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </section>
  );
}
