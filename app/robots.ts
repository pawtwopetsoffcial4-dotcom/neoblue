import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/checkout/', '/profile/', '/api/'],
    },
    sitemap: 'https://neoblue.in/sitemap.xml',
  };
}
