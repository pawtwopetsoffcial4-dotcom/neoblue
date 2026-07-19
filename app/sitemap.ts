import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Blog from '@/lib/models/Blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://neoblue.in';

  // Static routes
  const staticRoutes = [
    '',
    '/products',
    '/about',
    '/blog',
    '/privacy-policy',
    '/return-refund-policy',
    '/terms-and-conditions',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  let productRoutes: any[] = [];
  let blogRoutes: any[] = [];

  try {
    await connectDB();

    // Fetch approved & in-stock products
    const products = await Product.find({ approvalStatus: 'approved', inStock: true })
      .select('_id updatedAt')
      .lean();

    productRoutes = products.map((product: any) => ({
      url: `${baseUrl}/products/${product._id}`,
      lastModified: new Date(product.updatedAt || Date.now()).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Fetch published blogs
    const blogs = await Blog.find({ isPublished: true })
      .select('slug updatedAt')
      .lean();

    blogRoutes = blogs.map((blog: any) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: new Date(blog.updatedAt || Date.now()).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error generating sitemap routes:', error);
  }

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
