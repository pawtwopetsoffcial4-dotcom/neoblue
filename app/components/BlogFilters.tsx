'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import type { BlogCategory, BlogTag } from '@/lib/hooks/useBlog';

interface BlogFiltersProps {
  categories: BlogCategory[];
  tags: BlogTag[];
}

export default function BlogFilters({ categories, tags }: BlogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'oldest' | 'trending'>(
    (searchParams.get('sortBy') as any) || 'latest'
  );

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedTag) params.append('tag', selectedTag);
    if (sortBy && sortBy !== 'latest') params.append('sortBy', sortBy);
    params.append('page', '1');

    router.push(`/blog?${params.toString()}`);
  }, [search, selectedCategory, selectedTag, sortBy, router]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTag('');
    setSortBy('latest');
    router.push('/blog');
  }, [router]);

  const hasActiveFilters = search || selectedCategory || selectedTag;

  return (
    <aside className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-6 lg:mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-semibold text-slate-900 mb-2">
            Search
          </label>
          <div className="relative">
            <input
              id="search"
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute right-3 top-3 h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-semibold text-slate-900 mb-2">
            Sort By
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
            }}
            className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="views">Most Viewed</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">Categories</label>
            <div className="space-y-2 max-h-52 sm:max-h-64 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={selectedCategory === ''}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="text-sm text-slate-700">All Categories</span>
              </label>

              {categories.map((category) => (
                <label key={category._id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2.5 rounded transition-colors">
                  <input
                    type="radio"
                    name="category"
                    value={category.slug}
                    checked={selectedCategory === category.slug}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">{category.name}</span>
                  <span className="ml-auto text-xs text-slate-500">({category.blogsCount})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">Tags</label>
            <div className="space-y-2 max-h-52 sm:max-h-64 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
                <input
                  type="radio"
                  name="tag"
                  value=""
                  checked={selectedTag === ''}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="text-sm text-slate-700">All Tags</span>
              </label>

              {tags.slice(0, 20).map((tag) => (
                <label key={tag._id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2.5 rounded transition-colors">
                  <input
                    type="radio"
                    name="tag"
                    value={tag.slug}
                    checked={selectedTag === tag.slug}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-slate-700">{tag.name}</span>
                  <span className="ml-auto text-xs text-slate-500">({tag.blogsCount})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={applyFilters}
          className="w-full h-11 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
