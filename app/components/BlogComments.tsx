'use client';

import { useState, useEffect, useCallback } from 'react';

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
        setComments(data.data.comments);
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

  return (
    <section className="mt-16 max-w-3xl">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Comments ({comments.length})</h2>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Your comment has been submitted and will appear after admin approval.
        </div>
      )}

      {/* Comment Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add a Comment
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
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
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                  className={`text-2xl transition-colors ${
                    star <= formData.rating
                      ? 'text-yellow-400'
                      : 'text-slate-300 hover:text-yellow-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Comment *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Share your thoughts..."
              required
              minLength={3}
              maxLength={2000}
              rows={5}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="text-xs text-slate-500 mt-1">
              {formData.content.length} / 2000 characters
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Comment'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => {
            const date = new Date(comment.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={comment._id} className="p-4 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{comment.author}</p>
                    <p className="text-sm text-slate-500">{date}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= comment.rating
                            ? 'text-yellow-400'
                            : 'text-slate-300'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{comment.content}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-slate-600 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
      )}
    </section>
  );
}
