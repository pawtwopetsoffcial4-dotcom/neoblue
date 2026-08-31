'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@/lib/hooks/useBlog';
import { useMode } from '@/lib/hooks/useMode';

interface BlogCardProps {
  blog: BlogPost;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const { mode } = useMode();
  const isPlants = mode === 'plants';

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const accentColorClass = isPlants ? 'text-emerald-600' : 'text-blue-600';
  const categoryHoverClass = isPlants ? 'hover:text-emerald-800' : 'hover:text-blue-800';
  const titleHoverClass = isPlants ? 'group-hover:text-emerald-600' : 'group-hover:text-blue-600';
  const badgeBgClass = isPlants ? 'bg-emerald-600' : 'bg-blue-600';
  const borderHoverClass = isPlants 
    ? 'hover:border-emerald-200 hover:shadow-emerald-950/[0.04]' 
    : 'hover:border-blue-200 hover:shadow-blue-950/[0.04]';

  return (
    <article 
      className={`group flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 ${borderHoverClass} transition-all duration-500 ease-out overflow-hidden h-full`}
    >
      {/* Cover Image */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-50">
        <Image
          src={blog.coverImage}
          alt={blog.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Soft dark overlay on hover */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-500" />
        
        {blog.featured && (
          <div className="absolute top-4 left-4 z-10">
            <span className={`inline-flex items-center gap-1.5 ${badgeBgClass} text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        {/* Category */}
        {blog.category && (
          <div className="mb-2.5">
            <Link href={`/blog?category=${blog.category.slug}`} prefetch={false}>
              <span className={`inline-block text-xs font-bold ${accentColorClass} ${categoryHoverClass} uppercase tracking-widest transition-colors`}>
                {blog.category.name}
              </span>
            </Link>
          </div>
        )}

        {/* Title */}
        <Link href={`/blog/${blog.slug}`} prefetch={false}>
          <h3 className={`text-lg sm:text-xl font-extrabold text-slate-900 leading-snug line-clamp-2 ${titleHoverClass} transition-colors duration-300 mb-3`}>
            {blog.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-sm text-slate-500 font-normal leading-relaxed line-clamp-2 mb-5">
          {blog.excerpt}
        </p>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {blog.tags.slice(0, 2).map((tag) => (
              <Link key={tag._id} href={`/blog?tag=${tag.slug}`}>
                <span
                  className="inline-block text-2xs px-2.5 py-1 rounded-full text-white font-semibold tracking-wide hover:opacity-85 shadow-sm transition-opacity"
                  style={{ backgroundColor: tag.color }}
                >
                  #{tag.name}
                </span>
              </Link>
            ))}
            {blog.tags.length > 2 && (
              <span className="text-2xs text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-1 font-medium">
                +{blog.tags.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-y-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 text-2xs font-semibold text-slate-400 mt-auto pt-4 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{blog.author}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{blog.readTime} min read</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{blog.views} views</span>
          </div>

          <div className="flex items-center gap-1.5 sm:ml-auto">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time className="text-slate-400">{formattedDate}</time>
          </div>
        </div>
      </div>
    </article>
  );
}
