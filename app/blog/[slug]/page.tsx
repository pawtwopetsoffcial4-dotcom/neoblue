import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

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
  createdAt: string;
};

async function getBlog(slug: string): Promise<BlogDetail | null> {
  await connectDB();
  const blog = await Blog.findOne({ slug, isPublished: true });
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
    createdAt: blog.createdAt.toISOString(),
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  const paragraphs = blog.content.split(/\n\s*\n/).filter(Boolean);

  return (
    <main className="min-h-screen bg-white text-slate-900 pt-20 md:pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 mb-6">
          Back to Blog
        </Link>

        <article>
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{keyword}</span>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">{blog.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>{blog.author}</span>
            <span>{blog.readTime} min read</span>
          </div>

          <div className="mt-8 rounded-3xl overflow-hidden border border-blue-100 shadow-sm">
            <img src={blog.coverImage} alt={blog.title} className="w-full max-h-[520px] object-cover" />
          </div>

          <p className="mt-8 text-xl text-slate-600 leading-relaxed">{blog.excerpt}</p>

          <div className="mt-10 space-y-6 text-slate-700 leading-8 text-lg">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {blog.galleryImages.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blog.galleryImages.map((image) => (
                  <img key={image} src={image} alt={`${blog.title} gallery`} className="w-full h-72 object-cover rounded-3xl border border-blue-100" />
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </main>
  );
}