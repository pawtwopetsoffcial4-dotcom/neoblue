'use client';

import { useState, useEffect } from 'react';

interface BlogComment {
  _id: string;
  author: string;
  email: string;
  content: string;
  rating: number;
  isApproved: boolean;
  blogId: string;
  createdAt: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Note: You might want to create a specific endpoint to fetch all comments for admin
      // For now, this is a placeholder. You would need to create a GET /api/blogs/comments endpoint
      // that returns all comments for the admin user
      const res = await fetch('/api/blogs?limit=1000', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch comments');
      }

      // This is temporary - you would need a dedicated comments endpoint
      setComments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleApprove = async (commentId: string, blogId: string) => {
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ isApproved: true }),
      });

      if (!res.ok) {
        throw new Error('Failed to approve comment');
      }

      setSuccess('Comment approved');
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, isApproved: true } : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleDelete = async (commentId: string, blogId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/blogs/${blogId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete comment');
      }

      setSuccess('Comment deleted');
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filteredComments = comments.filter((c) => {
    if (filter === 'approved') return c.isApproved;
    if (filter === 'pending') return !c.isApproved;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Blog Comments</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({comments.filter(c => {
              if (f === 'all') return true;
              if (f === 'pending') return !c.isApproved;
              return c.isApproved;
            }).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading comments...</div>
      ) : filteredComments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-600">No comments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => {
            const date = new Date(comment.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={comment._id}
                className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{comment.author}</h3>
                    <p className="text-sm text-slate-500">
                      {comment.email} • {date}
                    </p>
                  </div>
                  <div className="flex gap-1">
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

                <p className="text-slate-700 mb-4">{comment.content}</p>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      comment.isApproved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {comment.isApproved ? 'Approved' : 'Pending'}
                  </span>

                  <div className="flex gap-2">
                    {!comment.isApproved && (
                      <button
                        onClick={() => handleApprove(comment._id, comment.blogId)}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment._id, comment.blogId)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
