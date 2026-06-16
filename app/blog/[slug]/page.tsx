import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
import BlogComments from '@/app/components/BlogComments';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    const blog = await Blog.findOne({ slug, isPublished: true });
    if (!blog) return {};

    return {
      title: `${blog.seoTitle || blog.title} | NeoBlue Insights`,
      description: blog.seoDescription || blog.excerpt,
      openGraph: {
        title: blog.seoTitle || blog.title,
        description: blog.seoDescription || blog.excerpt,
        images: blog.seoImage || blog.coverImage ? [{ url: blog.seoImage || blog.coverImage }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.seoTitle || blog.title,
        description: blog.seoDescription || blog.excerpt,
        images: blog.seoImage || blog.coverImage ? [blog.seoImage || blog.coverImage] : [],
      },
    };
  } catch (err) {
    return {};
  }
}

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

async function getBlog(slug: string): Promise<BlogDetail | null> {
  await connectDB();
  const blog = await Blog.findOne({ slug, isPublished: true })
    .populate('category', 'name slug')
    .populate('tags', 'name slug color');

  if (!blog) return null;

  return {
    _id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    coverImage: blog.coverImage,
    galleryImages: blog.galleryImages ?? [],
    keywords: blog.keywords ?? [],
    author: blog.author,
    featured: blog.featured,
    readTime: blog.readTime,
    views: blog.views || 0,
    category: blog.category
      ? {
          _id: blog.category._id.toString(),
          name: blog.category.name,
          slug: blog.category.slug,
        }
      : undefined,
    tags: blog.tags?.map((tag: any) => ({
      _id: tag._id.toString(),
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
    })),
    createdAt: blog.createdAt.toISOString(),
  };
}

async function getRelatedBlogs(blogId: string, categoryId: string | undefined): Promise<BlogDetail[]> {
  await connectDB();
  const relatedBlogs = await Blog.find({
    _id: { $ne: blogId },
    isPublished: true,
    ...(categoryId && { category: categoryId }),
  })
    .populate('category', 'name slug')
    .populate('tags', 'name slug color')
    .limit(3)
    .select('-content');

  return relatedBlogs.map((blog: any) => ({
    _id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    coverImage: blog.coverImage,
    galleryImages: blog.galleryImages ?? [],
    keywords: blog.keywords ?? [],
    author: blog.author,
    featured: blog.featured,
    readTime: blog.readTime,
    views: blog.views || 0,
    category: blog.category
      ? {
          _id: blog.category._id.toString(),
          name: blog.category.name,
          slug: blog.category.slug,
        }
      : undefined,
    tags: blog.tags?.map((tag: any) => ({
      _id: tag._id.toString(),
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
    })),
    createdAt: blog.createdAt.toISOString(),
  }));
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  const relatedBlogs = await getRelatedBlogs(blog._id, blog.category?._id);
  const paragraphs = blog.content.split(/\n\s*\n/).filter(Boolean);
  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-slate-50 pt-6 md:pt-12 pb-16 md:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm sm:text-base text-blue-600 font-semibold hover:text-blue-700 mb-6 md:mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        {/* Article Header */}
        <article className="mb-12">
          {/* Category */}
          {blog.category && (
            <Link href={`/blog?category=${blog.category.slug}`}>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 mb-4 transition-colors">
                {blog.category.name}
              </span>
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
            {blog.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 pb-5 sm:pb-6 border-b border-slate-200">
            <span className="font-medium">{blog.author}</span>
            <span className="text-slate-400">•</span>
            <time>{formattedDate}</time>
            <span className="text-slate-400">•</span>
            <span>{blog.readTime} min read</span>
            <span className="text-slate-400">•</span>
            <span>{blog.views} views</span>
          </div>

          {/* Featured Image */}
          <div className="mt-6 sm:mt-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full max-h-72 sm:max-h-96 object-cover"
            />
          </div>

          {/* Excerpt */}
          <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-slate-600 leading-relaxed font-medium">
            {blog.excerpt}
          </p>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <Link key={tag._id} href={`/blog?tag=${tag.slug}`}>
                  <span
                    className="inline-block text-xs font-semibold text-white px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div className="mt-8 sm:mt-10 space-y-5 sm:space-y-6 text-slate-700 leading-7 sm:leading-8 text-base sm:text-lg max-w-none">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="first-letter:capitalize">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Gallery */}
          {blog.galleryImages.length > 0 && (
            <section className="mt-12 sm:mt-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-5 sm:mb-6">Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blog.galleryImages.map((image, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                  >
                    <img
                      src={image}
                      alt={`${blog.title} gallery`}
                      className="w-full h-56 sm:h-72 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Comments */}
          <BlogComments blogId={blog._id} />
        </article>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <section className="mt-14 sm:mt-20 pt-10 sm:pt-12 border-t border-slate-200">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 sm:mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog._id}
                  href={`/blog/${relatedBlog.slug}`}
                  className="group rounded-lg overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={relatedBlog.coverImage}
                      alt={relatedBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                      {relatedBlog.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{relatedBlog.excerpt}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{relatedBlog.readTime} min read</span>
                      <span>{relatedBlog.views} views</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}