/**
 * NeoBlue Canonical Media & CDN-Independent Architecture Layer
 * 
 * decouples master file storage from CDN delivery & real-time transformations.
 * Database stores canonical storage keys (e.g. "products/betta-halfmoon-01.webp").
 * This layer dynamically resolves the active CDN endpoint with on-the-fly transformations.
 */

export interface MediaTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max' | 'extract';
  blur?: number;
  dpr?: number;
}

// Configurable CDN Endpoint (default: ImageKit delivery proxy)
export const CDN_URL_ENDPOINT = (
  process.env.NEXT_PUBLIC_CDN_URL_ENDPOINT ||
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
  ''
).replace(/\/+$/, '');

/**
 * Checks if a string is a full HTTP(S) URL
 */
export function isHttpUrl(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('http://') || str.startsWith('https://');
}

/**
 * Checks if a URL is hosted on ImageKit
 */
export function isImageKitUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('ik.imagekit.io') || url.includes('imagekit.io');
}

/**
 * Checks if a URL is hosted on Cloudinary
 */
export function isCloudinaryUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

/**
 * Extracts the canonical storage key from a full CDN URL or relative path.
 */
export function extractStorageKey(urlOrKey?: string | null): string {
  if (!urlOrKey || typeof urlOrKey !== 'string') return '';
  const trimmed = urlOrKey.trim();

  // If local static asset (e.g. /illustrations/placeholder.png)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // If ImageKit URL
  if (isImageKitUrl(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length > 1 && segments[0].length < 15) {
        return segments.slice(1).join('/');
      }
      return segments.join('/');
    } catch {
      return trimmed.replace(/^https?:\/\/[^\/]+\//, '').split('?')[0];
    }
  }

  // If Cloudinary URL
  if (isCloudinaryUrl(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const segments = parsed.pathname.split('/').filter(Boolean);
      // Typical path: /cloudname/image/upload/v12345/filename.jpg or /cloudname/image/upload/c_crop,.../v12345/filename.jpg
      const uploadIdx = segments.indexOf('upload');
      if (uploadIdx !== -1) {
        const afterUpload = segments.slice(uploadIdx + 1);
        // filter out transformation segment (e.g. c_crop,g_custom) and version segment (v178...)
        const keySegments = afterUpload.filter(s => !s.startsWith('v') && !s.includes(',') && !s.startsWith('c_'));
        return keySegments.length > 0 ? keySegments.join('/') : afterUpload[afterUpload.length - 1];
      }
    } catch {
      // ignore
    }
  }

  // Already a canonical key or raw string
  return trimmed.replace(/^\/+/, '');
}

/**
 * Builds ImageKit transformation query string
 */
function buildTransformQuery(options: MediaTransformOptions = {}): string {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    crop,
    blur,
    dpr,
  } = options;

  const transforms: string[] = [];

  if (width) transforms.push(`w-${width}`);
  if (height) transforms.push(`h-${height}`);
  if (quality) transforms.push(`q-${quality}`);
  if (format) transforms.push(`f-${format}`);
  if (crop) transforms.push(`c-${crop}`);
  if (blur) transforms.push(`bl-${blur}`);
  if (dpr) transforms.push(`dpr-${dpr}`);

  return transforms.join(',');
}

/**
 * Primary Media URL Resolver:
 * Takes any canonical storage key or legacy URL and resolves it to the active CDN with real-time transforms.
 * 
 * @param keyOrUrl Canonical key (e.g. "products/betta.webp") or legacy URL
 * @param options Responsive transformation parameters (width, height, quality, format, crop)
 */
export function getMediaUrl(keyOrUrl?: string | null, options: MediaTransformOptions = {}): string {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') return '';
  const trimmed = keyOrUrl.trim();
  if (!trimmed) return '';

  // 1. Local static assets remain local
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/products/')) {
    return trimmed;
  }

  // 2. Unsplash / external third-party URLs
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(trimmed);
      if (options.width) parsed.searchParams.set('w', String(options.width));
      if (options.quality) parsed.searchParams.set('q', String(options.quality));
      parsed.searchParams.set('auto', 'format');
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  // 3. Extract canonical key from ImageKit, Cloudinary, or relative paths
  const cleanKey = extractStorageKey(trimmed);
  if (!cleanKey) return trimmed;

  const trQuery = buildTransformQuery(options);
  const baseEndpoint = CDN_URL_ENDPOINT;
  const normalizedKey = cleanKey.replace(/^\/+/, '');
  const url = `${baseEndpoint}/${normalizedKey}`;

  if (!trQuery) return url;

  return `${url}?tr=${trQuery}`;
}

/**
 * Helper for Cart / Thumbnail previews (160x160 WebP)
 */
export function getThumbnailUrl(keyOrUrl?: string | null): string {
  return getMediaUrl(keyOrUrl, { width: 160, height: 160, quality: 75, format: 'auto' });
}

/**
 * Helper for Product Grid Cards (500x500 WebP)
 */
export function getCardImageUrl(keyOrUrl?: string | null): string {
  return getMediaUrl(keyOrUrl, { width: 500, height: 500, quality: 80, format: 'auto' });
}

/**
 * Helper for Product Detail Zoom Gallery & Banners (1200x1200 WebP)
 */
export function getHeroImageUrl(keyOrUrl?: string | null): string {
  return getMediaUrl(keyOrUrl, { width: 1200, height: 1200, quality: 85, format: 'auto' });
}

/**
 * Generates an ultra-lightweight blur placeholder for Next.js Image blurDataURL
 */
export function getPlaceholderBlurUrl(keyOrUrl?: string | null): string {
  return getMediaUrl(keyOrUrl, { width: 30, quality: 20, blur: 20, format: 'webp' });
}

// Alias for seamless backward compatibility with existing lib/imagekit imports
export const optimizeImage = (url?: string | null, width: number = 600, height?: number, quality: number = 80) =>
  getMediaUrl(url, { width, height, quality });

export const getImageKitUrl = (url?: string | null, options: MediaTransformOptions = {}) =>
  getMediaUrl(url, options);

export const getImageKitPlaceholder = (url?: string | null) =>
  getPlaceholderBlurUrl(url);
