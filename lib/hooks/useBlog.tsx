import { useCallback, useEffect, useState } from 'react';

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  featured: boolean;
  readTime: number;
  views: number;
  createdAt: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    _id: string;
    name: string;
    slug: string;
    color: string;
  }>;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  blogsCount: number;
}

export interface BlogTag {
  _id: string;
  name: string;
  slug: string;
  color: string;
  blogsCount: number;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

interface UseBlogsOptions {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: 'latest' | 'views' | 'oldest' | 'trending';
}

export function useBlogs(options: UseBlogsOptions = {}) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', String(options.page));
      if (options.limit) params.append('limit', String(options.limit));
      if (options.category) params.append('category', options.category);
      if (options.tag) params.append('tag', options.tag);
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);

      const res = await fetch(`/api/blogs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch blogs');
      }

      setBlogs(data.data.blogs);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.category, options.tag, options.search, options.sortBy]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return { blogs, pagination, loading, error, refetch: fetchBlogs };
}

export function useCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/blogs/categories');
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch categories');
        }

        setCategories(data.data.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useTags() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/blogs/tags');
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch tags');
        }

        setTags(data.data.tags);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading, error };
}
