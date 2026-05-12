'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@/lib/hooks/useBlog';

interface BlogCardProps {
  blog: BlogPost;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100">
        <Image
          src={blog.coverImage}
          alt={blog.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {blog.featured && (
          <div className="absolute top-3 left-3">
            <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-5">
        {/* Category */}
        {blog.category && (
          <Link href={`/blog?category=${blog.category.slug}`}>
            <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 hover:text-blue-700">
              {blog.category.name}
            </span>
          </Link>
        )}

        {/* Title */}
        <Link href={`/blog/${blog.slug}`}>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
            {blog.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-2.5 sm:mb-3">{blog.excerpt}</p>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {blog.tags.slice(0, 2).map((tag) => (
              <Link key={tag._id} href={`/blog?tag=${tag.slug}`}>
                <span
                  className="inline-block text-xs px-2 py-1 rounded-full text-white font-medium hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              </Link>
            ))}
            {blog.tags.length > 2 && (
              <span className="text-xs text-slate-500 px-2 py-1">+{blog.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-auto pt-3 border-t border-slate-100">
          <span>{blog.author}</span>
          <span>{blog.readTime} min read</span>
          <span>{blog.views} views</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </article>
  );
}
