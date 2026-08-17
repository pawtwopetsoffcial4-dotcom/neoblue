const BASE_URL = 'https://neoblue.in';

/**
 * Ensures an image URL is absolute and suitable for OG/social sharing.
 * - If it's already an absolute URL (https://...), returns as-is.
 * - If it's a relative path (e.g. /fishes_cat_cover/Plants.png), prepends the base URL.
 * - Returns null if no valid image is provided.
 */
export function resolveOgImageUrl(imageUrl: string | undefined | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Relative path — prepend base URL
  return `${BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

/**
 * Finds the best product image for OG tags.
 * Prefers absolute Cloudinary URLs over local category cover images.
 */
export function getBestProductOgImage(images: string[] | undefined): string | null {
  if (!images || images.length === 0) return null;
  
  // Prefer the first absolute URL (Cloudinary/external)
  const absoluteImage = images.find(
    (img) => img.startsWith('http://') || img.startsWith('https://')
  );
  if (absoluteImage) return absoluteImage;
  
  // Fallback: resolve relative path
  return resolveOgImageUrl(images[0]);
}

/**
 * Builds a JSON-LD Organization schema for NeoBlue.
 */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NeoBlue',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "India's premium marketplace for live aquarium fish, shrimp, snails, and aquatic plants with live-arrival guaranteed delivery.",
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },
    sameAs: [],
  };
}

/**
 * Builds a JSON-LD WebSite schema with SearchAction for sitelinks search box.
 */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NeoBlue',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Builds a JSON-LD BreadcrumbList schema.
 */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Builds a JSON-LD CollectionPage + ItemList schema for category/listing pages.
 */
export function buildCollectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  products: Array<{
    _id: string;
    title: string;
    price: number;
    images?: string[];
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: opts.products.length,
      itemListElement: opts.products.slice(0, 20).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.title,
          url: `${BASE_URL}/products/${product._id}`,
          image: getBestProductOgImage(product.images),
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.price,
            availability: 'https://schema.org/InStock',
          },
        },
      })),
    },
  };
}

/**
 * Builds a JSON-LD Article schema for blog posts.
 */
export function buildArticleJsonLd(opts: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  datePublished: string;
  dateModified?: string;
  author: string;
  keywords?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    image: opts.image || `${BASE_URL}/logo.png`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: {
      '@type': 'Person',
      name: opts.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'NeoBlue',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    keywords: opts.keywords?.join(', '),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': opts.url,
    },
  };
}
