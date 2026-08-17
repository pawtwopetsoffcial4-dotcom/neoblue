import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Blog from '@/lib/models/Blog';
import User from '@/lib/models/User';
import Combo from '@/lib/models/Combo';

const toSlug = (value: string) => 
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://neoblue.in';

  let productRoutes: any[] = [];
  let blogRoutes: any[] = [];
  let categoryRoutes: any[] = [];
  let vendorRoutes: any[] = [];
  let comboRoutes: any[] = [];
  let latestUpdate = '2026-08-01T00:00:00.000Z';

  try {
    await connectDB();

    // Fetch all approved products (include out-of-stock so Google keeps them indexed)
    const products = await Product.find({ approvalStatus: 'approved' })
      .select('_id title category images updatedAt')
      .lean();

    // Track the most recent product update for static route lastModified
    for (const p of products as any[]) {
      const d = p.updatedAt ? new Date(p.updatedAt).toISOString() : latestUpdate;
      if (d > latestUpdate) latestUpdate = d;
    }

    productRoutes = (products as any[]).map((product) => ({
      url: `${baseUrl}/products/${product._id}`,
      lastModified: new Date(product.updatedAt || Date.now()).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      ...(product.images?.[0] ? {
        images: [product.images.find((img: string) => img.startsWith('http')) || `${baseUrl}${product.images[0]}`],
      } : {}),
    }));

    // Extract unique categories dynamically from products and generate category paths
    const uniqueCategories = Array.from(new Set((products as any[]).map((p) => p.category).filter(Boolean)));
    categoryRoutes = uniqueCategories.map((category: any) => ({
      url: `${baseUrl}/categories/${toSlug(category)}`,
      lastModified: latestUpdate,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));

    // Fetch published blogs
    const blogs = await Blog.find({ isPublished: true })
      .select('slug updatedAt')
      .lean();

    blogRoutes = (blogs as any[]).map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: new Date(blog.updatedAt || Date.now()).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Fetch approved vendors with slug
    const vendors = await User.find({ role: 'vendor', isApproved: true })
      .select('slug updatedAt')
      .lean();

    vendorRoutes = (vendors as any[]).map((vendor) => {
      const slugVal = vendor.slug || vendor._id.toString();
      return {
        url: `${baseUrl}/shop/${slugVal}`,
        lastModified: new Date(vendor.updatedAt || Date.now()).toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });
    // Fetch active combos
    const combos = await Combo.find({ isActive: true })
      .select('_id updatedAt')
      .lean();

    comboRoutes = (combos as any[]).map((combo) => ({
      url: `${baseUrl}/combos/${combo._id}`,
      lastModified: new Date(combo.updatedAt || Date.now()).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch (error) {
    console.error('Error generating sitemap routes:', error);
  }

  // Static routes use the most recent product update date, not new Date()
  const staticRoutes = [
    '',
    '/products',
    '/categories',
    '/combos',
    '/about',
    '/blog',
    '/privacy-policy',
    '/return-refund-policy',
    '/terms-and-conditions',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: latestUpdate,
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...comboRoutes, ...blogRoutes, ...vendorRoutes];
}

