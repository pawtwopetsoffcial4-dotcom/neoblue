import { MetadataRoute } from 'next';

export const revalidate = 86400; // 24 hours edge cache

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/checkout/',
          '/profile/',
          '/api/',
          '/login/',
          '/auth/',
          '/orders/',
          '/vendor/',
          '/vendors/',
          '/hometest/',
          '/*?*search=',
          '/*?*filter=',
          '/*_rsc=*',
        ],
        crawlDelay: 10,
      },
      {
        userAgent: [
          'Bytespider',
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'anthropic-ai',
          'CCBot',
          'AhrefsBot',
          'SemrushBot',
          'MJ12bot',
          'DotBot',
          'PetalBot',
          'Amazonbot',
          'Scrapy',
        ],
        disallow: ['/'],
      },
    ],
    sitemap: 'https://neoblue.in/sitemap.xml',
  };
}
