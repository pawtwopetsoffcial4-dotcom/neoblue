'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BlogCard from '@/app/components/BlogCard';
import BlogFilters from '@/app/components/BlogFilters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useBlogs, useCategories, useTags } from '@/lib/hooks/useBlog';
import { useMode } from '@/lib/hooks/useMode';

function BlogPageContent() {
  const searchParams = useSearchParams();
  const { mode } = useMode();
  const isPlants = mode === 'plants';

  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortBy = (searchParams.get('sortBy') || 'latest') as any;

  const { blogs, pagination, loading } = useBlogs({
    page,
    limit: 12,
    category,
    tag,
    search,
    sortBy,
  });

  const { categories } = useCategories();
  const { tags } = useTags();

  const accentColorClass = isPlants ? 'text-emerald-600' : 'text-blue-600';
  const buttonBgClass = isPlants ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/10' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10';
  const buttonBorderClass = isPlants ? 'hover:border-emerald-600 hover:text-emerald-600' : 'hover:border-blue-600 hover:text-blue-600';
  const loadingIndicatorClass = isPlants ? 'text-emerald-600' : 'text-blue-600';

  return (
    <main className="relative min-h-screen bg-slate-50/50 pt-8 md:pt-16 pb-20 md:pb-28 overflow-hidden">
      {/* Decorative Background Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-[radial-gradient(100%_50%_at_50%_0%,rgba(120,119,198,0.03)_0,rgba(255,255,255,0)_100%)] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-10 md:mb-16 animate-fade-in-up">
          <p className={`text-xs font-bold uppercase tracking-[0.25em] ${accentColorClass} mb-3`}>
            Insights & Knowledge
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-4 leading-none">
            Our <span className={accentColorClass}>Blog</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-500 max-w-2xl font-medium leading-relaxed">
            Aquarium care guides, fish profiles, aquascaping tips, and expert inspiration from the NeoBlue team.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 animate-fade-in-up">
            <BlogFilters categories={categories} tags={tags} />
          </div>

          {/* Main Grid Content */}
          <div className="lg:col-span-3">
            {/* Loading Spinner */}
            {loading && (
              <div className="flex flex-col justify-center items-center py-20 bg-white/50 rounded-2xl border border-slate-100 backdrop-blur-sm shadow-sm animate-fade-in-up">
                <LoadingSpinner size={44} label="Fetching Articles..." />
              </div>
            )}

            {/* Articles Grid */}
            {!loading && blogs.length > 0 && (
              <div className="animate-fade-in-up">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                  {blogs.map((blog) => (
                    <BlogCard key={blog._id} blog={blog} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 md:mt-16 flex-wrap">
                    {Array.from({ length: pagination.pages }).map((_, i) => {
                      const pageNum = i + 1;
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('page', String(pageNum));

                      const isActive = pageNum === page;

                      return (
                        <a
                          key={pageNum}
                          href={`/blog?${params.toString()}`}
                          className={`w-10 h-10 text-sm flex items-center justify-center rounded-xl font-bold transition-all duration-300 ${
                            isActive
                              ? `${buttonBgClass} shadow-md`
                              : `bg-white border border-slate-200 text-slate-700 ${buttonBorderClass} hover:shadow-sm`
                          }`}
                        >
                          {pageNum}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && blogs.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-16 text-center shadow-sm animate-fade-in-up">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-slate-50 text-slate-400 mb-5">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No articles found</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-6">
                  {search || category || tag 
                    ? "We couldn't find any articles matching your search or filters. Try resetting them." 
                    : "There are no blog posts published at the moment. Check back soon!"}
                </p>
                {(search || category || tag) && (
                  <a
                    href="/blog"
                    className={`inline-flex items-center h-10 px-5 rounded-xl text-sm font-semibold transition-all duration-300 ${buttonBgClass}`}
                  >
                    Reset Filters
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <LoadingSpinner size={48} label="Loading Blog Insights..." />
      </div>
    }>
      <BlogPageContent />
    </Suspense>
  );
}