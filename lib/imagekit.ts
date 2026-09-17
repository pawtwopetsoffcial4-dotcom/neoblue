/**
 * ImageKit Media & Optimization Helpers for Neoblue
 */

export const IMAGEKIT_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/dsh4kn2d6';

export interface ImageKitTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max' | 'extract';
  cropMode?: 'pad_resize' | 'pad_extract' | 'c-maintain_ratio';
  blur?: number;
  rotate?: number;
  radius?: number | 'max';
  dpr?: number;
}

/**
 * Checks if a given URL is hosted on ImageKit
 */
export function isImageKitUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('ik.imagekit.io') || url.includes('imagekit.io');
}

/**
 * Transforms an ImageKit URL with real-time optimization parameters
 */
export function getImageKitUrl(url?: string | null, options: ImageKitTransformOptions = {}): string {
  if (!url || typeof url !== 'string') return '';

  // If not an ImageKit URL, return as-is
  if (!isImageKitUrl(url)) return url;

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    crop,
    blur,
    rotate,
    radius,
    dpr,
  } = options;

  const transforms: string[] = [];

  if (width) transforms.push(`w-${width}`);
  if (height) transforms.push(`h-${height}`);
  if (quality) transforms.push(`q-${quality}`);
  if (format) transforms.push(`f-${format}`);
  if (crop) transforms.push(`c-${crop}`);
  if (blur) transforms.push(`bl-${blur}`);
  if (rotate) transforms.push(`rt-${rotate}`);
  if (radius) transforms.push(`r-${radius}`);
  if (dpr) transforms.push(`dpr-${dpr}`);

  if (transforms.length === 0) return url;

  const trString = transforms.join(',');

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('tr', trString);
    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tr=${trString}`;
  }
}

/**
 * Generates an ultra-lightweight blurred placeholder URL for Instant Loading / Next.js blurDataURL
 */
export function getImageKitPlaceholder(url?: string | null): string {
  return getImageKitUrl(url, {
    width: 30,
    quality: 20,
    blur: 20,
    format: 'webp',
  });
}

/**
 * Automatically optimizes an image URL regardless of provider (ImageKit, Cloudinary, Unsplash)
 */
export function optimizeImage(
  url?: string | null,
  width: number = 600,
  height?: number,
  quality: number = 80
): string {
  if (!url || typeof url !== 'string') return '';

  if (isImageKitUrl(url)) {
    return getImageKitUrl(url, { width, height, quality, format: 'auto' });
  }

  // Handle Unsplash dynamic resize
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(quality));
      parsed.searchParams.set('auto', 'format');
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}
