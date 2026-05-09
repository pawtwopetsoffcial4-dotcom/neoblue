import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';

export const dynamic = 'force-dynamic';

type BlogCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  keywords: string[];
  author: string;
  featured: boolean;
  readTime: number;
  createdAt: string;
};

async function getBlogs(): Promise<BlogCard[]> {
  await connectDB();
  const blogs = await Blog.find({ isPublished: true }).sort({ featured: -1, createdAt: -1 }).limit(50);
  return blogs.map((blog) => ({
    _id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    coverImage: blog.coverImage,
    keywords: blog.keywords ?? [],
    author: blog.author,
    featured: blog.featured,
    readTime: blog.readTime,
    createdAt: blog.createdAt.toISOString(),
  }));
}

export default async function BlogPage() {
  const blogs = await getBlogs();

  return (
    <main className="min-h-screen bg-white text-slate-900 pt-6 md:pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600 mb-3">Insights</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Blog</h1>
          <p className="mt-4 max-w-2xl text-slate-600">Aquarium care, fish profiles, setup notes, and tank inspiration from the Neoblue team.</p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <article key={blog._id} className="group rounded-3xl overflow-hidden border border-blue-100 bg-white shadow-sm hover:border-blue-300 transition-colors">
              <div className="relative aspect-4/3 overflow-hidden">
                <img src={blog.coverImage} alt={blog.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/15 to-transparent" />
                {blog.featured && <span className="absolute top-4 left-4 rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wide">Featured</span>}
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-3">
                  {blog.keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{keyword}</span>
                  ))}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{blog.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{blog.excerpt}</p>
                <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                  <span>{blog.author}</span>
                  <span>{blog.readTime} min read</span>
                </div>
                <Link href={`/blog/${blog.slug}`} className="mt-5 inline-flex items-center justify-center h-11 px-5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                  Read Post
                </Link>
              </div>
            </article>
          ))}
        </section>

        {blogs.length === 0 && (
          <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-12 text-center text-slate-600 mt-8">
            No blog posts yet.
          </div>
        )}
      </div>
    </main>
  );
}