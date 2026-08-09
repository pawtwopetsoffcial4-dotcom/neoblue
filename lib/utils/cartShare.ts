import type { CartItem } from '@/lib/hooks/useCart';

export type SharedCartItem = {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

/**
 * Encodes cart items into a compressed base64 string for URL sharing.
 */
export function encodeSharedCart(items: CartItem[]): string {
  if (!items || items.length === 0) return '';
  try {
    const compact = items.map((item) => ({
      p: item.productId,
      q: item.quantity,
      t: item.title,
      pr: item.price,
      img: item.image,
    }));
    const jsonStr = JSON.stringify(compact);
    // Base64 encode safely for URLs
    const base64 = btoa(encodeURIComponent(jsonStr));
    return base64;
  } catch (err) {
    console.error('Failed to encode shared cart:', err);
    return '';
  }
}

/**
 * Decodes a shared cart base64 string into CartItem array.
 */
export function decodeSharedCart(encoded: string): SharedCartItem[] | null {
  if (!encoded) return null;
  try {
    const jsonStr = decodeURIComponent(atob(encoded));
    const raw = JSON.parse(jsonStr);
    if (!Array.isArray(raw)) return null;

    return raw.map((item: any) => ({
      productId: String(item.p || ''),
      quantity: Number(item.q) || 1,
      title: String(item.t || 'Product'),
      price: Number(item.pr) || 0,
      image: String(item.img || ''),
    })).filter((item) => Boolean(item.productId));
  } catch (err) {
    console.error('Failed to decode shared cart:', err);
    return null;
  }
}

/**
 * Generates full shareable URL for the current cart.
 */
export function getShareableCartUrl(items: CartItem[]): string {
  const code = encodeSharedCart(items);
  if (!code) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://neoblue.in';
  return `${origin}/checkout?shared_cart=${code}`;
}
