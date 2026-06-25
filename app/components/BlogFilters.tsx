'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import type { BlogCategory, BlogTag } from '@/lib/hooks/useBlog';
import { useMode } from '@/lib/hooks/useMode';

interface BlogFiltersProps {
  categories: BlogCategory[];
  tags: BlogTag[];
}

export default function BlogFilters({ categories, tags }: BlogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode } = useMode();
  const isPlants = mode === 'plants';

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'oldest' | 'trending'>(
    (searchParams.get('sortBy') as any) || 'latest'
  );
  
  // Mobile accordion toggle
  const [isOpen, setIsOpen] = useState(false);

  // Sync state with URL search parameters
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedTag(searchParams.get('tag') || '');
    setSortBy((searchParams.get('sortBy') as any) || 'latest');
  }, [searchParams]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedTag) params.append('tag', selectedTag);
    if (sortBy && sortBy !== 'latest') params.append('sortBy', sortBy);
    params.append('page', '1');

    router.push(`/blog?${params.toString()}`);
    setIsOpen(false); // close drawer on mobile
  }, [search, selectedCategory, selectedTag, sortBy, router]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTag('');
    setSortBy('latest');
    router.push('/blog');
    setIsOpen(false);
  }, [router]);

  const hasActiveFilters = !!(search.trim() || selectedCategory || selectedTag || sortBy !== 'latest');

  const focusRingClass = isPlants ? 'focus:ring-emerald-500/20 focus:border-emerald-600' : 'focus:ring-blue-500/20 focus:border-blue-600';
  const buttonBgClass = isPlants ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10';
  const clearTextClass = isPlants ? 'text-emerald-600 hover:text-emerald-700' : 'text-blue-600 hover:text-blue-700';

  return (
    <aside className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50 lg:border-b-0 lg:pb-0 lg:mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Filters</h2>
          {hasActiveFilters && (
            <span className={`w-2 h-2 rounded-full ${isPlants ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`text-xs font-semibold ${clearTextClass} transition-colors cursor-pointer`}
            >
              Clear all
            </button>
          )}
          {/* Mobile Accordion Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            aria-label="Toggle Filters"
          >
            <svg 
              className={`w-4 h-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Body Container */}
      <div className={`${isOpen ? 'block animate-fade-in-up' : 'hidden lg:block'} space-y-6 mt-6 lg:mt-0`}>
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Search
          </label>
          <div className="relative">
            <input
              id="search"
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className={`w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-4 ${focusRingClass} placeholder:text-slate-400 bg-slate-50/50 hover:bg-white focus:bg-white transition-all`}
            />
            <div className="absolute right-3.5 top-3.5">
              <svg
                className="h-4.5 w-4.5 text-slate-400"
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
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Sort By
          </label>
          <div className="relative">
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-4 ${focusRingClass} bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium transition-all appearance-none cursor-pointer`}
            >
              <option value="latest">Latest Articles</option>
              <option value="views">Most Viewed</option>
              <option value="oldest">Oldest First</option>
              <option value="trending">Trending Now</option>
            </select>
            <div className="absolute right-4 top-4.5 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Categories
            </label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCategory === ''
                    ? `${isPlants ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'} shadow-sm`
                    : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                All Categories
              </button>

              {categories.map((category) => {
                const isSelected = selectedCategory === category.slug;
                return (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? `${isPlants ? 'bg-emerald-600 text-white shadow-emerald-500/10' : 'bg-blue-600 text-white shadow-blue-500/10'} shadow-sm`
                        : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {category.name} <span className="text-3xs opacity-80">({category.blogsCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  selectedTag === ''
                    ? `${isPlants ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'} shadow-sm`
                    : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                All Tags
              </button>

              {tags.slice(0, 20).map((tag) => {
                const isSelected = selectedTag === tag.slug;
                return (
                  <button
                    key={tag._id}
                    type="button"
                    onClick={() => setSelectedTag(tag.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-250 cursor-pointer ${
                      isSelected
                        ? 'text-white shadow-sm border-transparent'
                        : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                    style={{
                      backgroundColor: isSelected ? tag.color : undefined,
                      borderColor: isSelected ? 'transparent' : undefined,
                    }}
                  >
                    #{tag.name} <span className="text-3xs opacity-80">({tag.blogsCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={applyFilters}
          className={`w-full h-11 px-4 ${buttonBgClass} text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-[1px] cursor-pointer`}
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
