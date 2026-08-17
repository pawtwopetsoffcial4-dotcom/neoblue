import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/utils/seo';
import BlogDetailClient from './BlogDetailClient';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    await connectDB();
    const blogs = await Blog.find({ isPublished: true }).select('slug').lean();
    return blogs.map((b: any) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    const blog = await Blog.findOne({ slug, isPublished: true });
    if (!blog) return {};

    return {
      title: `${blog.seoTitle || blog.title} | NeoBlue Insights`,
      description: blog.seoDescription || blog.excerpt,
      keywords: blog.keywords || [blog.title, 'aquarium', 'fish care', 'NeoBlue'],
      alternates: { canonical: `https://neoblue.in/blog/${slug}` },
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildArticleJsonLd({
              title: blog.title,
              description: blog.excerpt,
              image: blog.coverImage,
              datePublished: blog.createdAt,
              author: blog.author,
              url: `https://neoblue.in/blog/${slug}`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: 'Home', url: 'https://neoblue.in' },
              { name: 'Blog', url: 'https://neoblue.in/blog' },
              { name: blog.title, url: `https://neoblue.in/blog/${slug}` },
            ])
          ),
        }}
      />
      <BlogDetailClient
        blog={blog}
        relatedBlogs={relatedBlogs}
        paragraphs={paragraphs}
        formattedDate={formattedDate}
      />
    </>
  );
}