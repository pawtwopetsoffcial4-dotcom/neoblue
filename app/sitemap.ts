import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Blog from '@/lib/models/Blog';
import User from '@/lib/models/User';

const toSlug = (value: string) => 
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://neoblue.in';

  // Static routes
  const staticRoutes = [
    '',
    '/products',
    '/categories',
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
  let categoryRoutes: any[] = [];
  let vendorRoutes: any[] = [];

  try {
    await connectDB();

    // Fetch approved & in-stock products
    const products = await Product.find({ approvalStatus: 'approved', inStock: true })
      .select('_id category updatedAt')
      .lean();

    productRoutes = products.map((product: any) => ({
      url: `${baseUrl}/products/${product._id}`,
      lastModified: new Date(product.updatedAt || Date.now()).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Extract unique categories dynamically from products and generate category paths
    const uniqueCategories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
    categoryRoutes = uniqueCategories.map((category: any) => ({
      url: `${baseUrl}/categories/${toSlug(category)}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
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

    // Fetch approved vendors with slug
    const vendors = await User.find({ role: 'vendor', isApproved: true })
      .select('slug updatedAt')
      .lean();

    vendorRoutes = vendors.map((vendor: any) => {
      const slugVal = vendor.slug || vendor._id.toString();
      return {
        url: `${baseUrl}/shop/${slugVal}`,
        lastModified: new Date(vendor.updatedAt || Date.now()).toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });
  } catch (error) {
    console.error('Error generating sitemap routes:', error);
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes, ...vendorRoutes];
}
