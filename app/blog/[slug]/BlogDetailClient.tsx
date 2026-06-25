'use client';

import Link from 'next/link';
import BlogCard from '@/app/components/BlogCard';
import BlogComments from '@/app/components/BlogComments';
import { useMode } from '@/lib/hooks/useMode';

type BlogDetail = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  galleryImages: string[];
  keywords: string[];
  author: string;
  featured: boolean;
  readTime: number;
  views: number;
  category?: { _id: string; name: string; slug: string };
  tags?: Array<{ _id: string; name: string; slug: string; color: string }>;
  createdAt: string;
};

interface BlogDetailClientProps {
  blog: BlogDetail;
  relatedBlogs: BlogDetail[];
  paragraphs: string[];
  formattedDate: string;
}

export default function BlogDetailClient({
  blog,
  relatedBlogs,
  paragraphs,
  formattedDate,
}: BlogDetailClientProps) {
  const { mode } = useMode();
  const isPlants = mode === 'plants';

  const accentColorClass = isPlants ? 'text-emerald-600' : 'text-blue-600';
  const textHoverClass = isPlants ? 'hover:text-emerald-700' : 'hover:text-blue-700';
  const badgeBgClass = isPlants ? 'bg-emerald-600' : 'bg-blue-600';
  
  // Custom mode-based drop cap classes for premium typography
  const dropCapColorClass = isPlants 
    ? 'first-letter:text-emerald-600' 
    : 'first-letter:text-blue-600';

  return (
    <main className="relative min-h-screen bg-slate-50/50 pt-8 md:pt-16 pb-20 md:pb-28">
      {/* Decorative Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-[radial-gradient(100%_50%_at_50%_0%,rgba(120,119,198,0.02)_0,rgba(255,255,255,0)_100%)] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6 md:mb-8 animate-fade-in-up">
          <Link
            href="/blog"
            className={`group inline-flex items-center gap-2 text-sm sm:text-base font-bold ${accentColorClass} ${textHoverClass} transition-colors`}
          >
            <svg 
              className="w-4.5 h-4.5 transform group-hover:-translate-x-1 transition-transform duration-300 ease-out" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>

        {/* Article Wrapper */}
        <article className="animate-fade-in-up">
          {/* Category Header */}
          {blog.category && (
            <div className="mb-4">
              <Link href={`/blog?category=${blog.category.slug}`}>
                <span className={`inline-block text-xs font-bold uppercase tracking-widest ${accentColorClass} ${textHoverClass} transition-colors`}>
                  {blog.category.name}
                </span>
              </Link>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-xs sm:text-sm font-semibold text-slate-500 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-slate-700">{blog.author}</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time className="text-slate-600">{formattedDate}</time>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-600">{blog.readTime} min read</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-slate-600">{blog.views} views</span>
            </div>
          </div>

          {/* Cinematic Hero Cover Image */}
          <div className="mt-8 rounded-2xl overflow-hidden border border-slate-100 shadow-lg shadow-slate-100 bg-slate-100 aspect-video relative">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Lead / Excerpt Paragraph */}
          <p className="mt-8 text-lg sm:text-xl text-slate-600 leading-relaxed font-semibold border-l-4 border-slate-200 pl-4 py-1">
            {blog.excerpt}
          </p>

          {/* Tags list */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <Link key={tag._id} href={`/blog?tag=${tag.slug}`}>
                  <span
                    className="inline-block text-xs font-bold text-white px-3.5 py-1.5 rounded-full hover:opacity-85 shadow-sm transition-opacity"
                    style={{ backgroundColor: tag.color }}
                  >
                    #{tag.name}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Main Article Content with Drop Cap */}
          <div className="mt-10 space-y-6 text-slate-700 leading-8 text-base sm:text-lg max-w-none font-medium">
            {paragraphs.map((paragraph, index) => {
              if (index === 0) {
                return (
                  <p 
                    key={index} 
                    className={`first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none ${dropCapColorClass}`}
                  >
                    {paragraph}
                  </p>
                );
              }
              return (
                <p key={index}>
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Image Gallery */}
          {blog.galleryImages && blog.galleryImages.length > 0 && (
            <section className="mt-16 pt-10 border-t border-slate-100">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">Article Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blog.galleryImages.map((image, idx) => (
                  <div
                    key={idx}
                    className="group rounded-2xl overflow-hidden border border-slate-100 shadow-md aspect-4/3 bg-slate-50 relative"
                  >
                    <img
                      src={image}
                      alt={`${blog.title} gallery specimen ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/5 transition-colors duration-300" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Comments Section */}
          <BlogComments blogId={blog._id} />
        </article>

        {/* Related Posts */}
        {relatedBlogs && relatedBlogs.length > 0 && (
          <section className="mt-20 pt-12 border-t border-slate-100">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <BlogCard key={relatedBlog._id} blog={relatedBlog as any} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
