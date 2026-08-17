import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/checkout/', '/profile/', '/api/', '/login/', '/auth/', '/orders/', '/vendor/', '/vendors/', '/hometest/'],
    },
    sitemap: 'https://neoblue.in/sitemap.xml',
  };
}
