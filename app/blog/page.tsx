'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BlogCard from '@/app/components/BlogCard';
import BlogFilters from '@/app/components/BlogFilters';
import { useBlogs, useCategories, useTags } from '@/lib/hooks/useBlog';

function BlogPageContent() {
  const searchParams = useSearchParams();
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

  return (
    <main className="min-h-screen bg-slate-50 pt-6 md:pt-12 pb-16 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600 mb-3">Insights & Knowledge</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-3 md:mb-4">Blog</h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl">
            Aquarium care guides, fish profiles, setup tips, and inspiration from the Neoblue team.
          </p>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <BlogFilters categories={categories} tags={tags} />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Blog Grid */}
            {!loading && blogs.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                  {blogs.map((blog) => (
                    <BlogCard key={blog._id} blog={blog} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 md:mt-12 flex-wrap">
                    {Array.from({ length: pagination.pages }).map((_, i) => {
                      const pageNum = i + 1;
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('page', String(pageNum));

                      return (
                        <a
                          key={pageNum}
                          href={`/blog?${params.toString()}`}
                          className={`w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base flex items-center justify-center rounded-lg font-semibold transition-colors ${
                            pageNum === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-slate-300 text-slate-900 hover:border-blue-600 hover:text-blue-600'
                          }`}
                        >
                          {pageNum}
                        </a>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!loading && blogs.length === 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-slate-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13V7m0 0H9m4 0h4"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No posts found</h3>
                <p className="text-slate-600">
                  {search || category || tag ? 'Try adjusting your filters or search terms.' : 'Check back soon for new content!'}
                </p>
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
    <Suspense fallback={<div>Loading...</div>}>
      <BlogPageContent />
    </Suspense>
  );
}