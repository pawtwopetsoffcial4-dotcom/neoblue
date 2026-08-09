import type { CartItem } from '@/lib/hooks/useCart';

export type SharedCartItem = {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

export type ShortCartItem = {
  productId: string;
  quantity: number;
};

/**
 * Encodes cart items into an ultra-short URL-friendly string format (e.g. "id1:qty1~id2:qty2").
 */
export function encodeSharedCart(items: CartItem[]): string {
  if (!items || items.length === 0) return '';
  return items.map((item) => `${item.productId}:${item.quantity}`).join('~');
}

/**
 * Decodes short cart string ("id1:qty1~id2:qty2") or legacy base64 format into ShortCartItem array.
 */
export function decodeSharedCart(encoded: string): ShortCartItem[] | null {
  if (!encoded) return null;
  try {
    // 1. Try decoding ultra-short format (e.g. "66a123:2~66b456:1")
    if (encoded.includes(':') || encoded.includes('~')) {
      const pairs = encoded.split('~');
      const items = pairs
        .map((pair) => {
          const [id, qtyStr] = pair.split(':');
          return {
            productId: id?.trim() || '',
            quantity: parseInt(qtyStr || '1', 10) || 1,
          };
        })
        .filter((item) => Boolean(item.productId));

      if (items.length > 0) return items;
    }

    // 2. Fallback to legacy base64 format
    const jsonStr = decodeURIComponent(atob(encoded));
    const raw = JSON.parse(jsonStr);
    if (!Array.isArray(raw)) return null;

    return raw
      .map((item: any) => ({
        productId: String(item.p || item.productId || ''),
        quantity: Number(item.q || item.quantity) || 1,
      }))
      .filter((item) => Boolean(item.productId));
  } catch (err) {
    console.error('Failed to decode shared cart:', err);
    return null;
  }
}

/**
 * Generates ultra-short shareable URL for the current cart.
 */
export function getShareableCartUrl(items: CartItem[]): string {
  const code = encodeSharedCart(items);
  if (!code) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://neoblue.in';
  return `${origin}/checkout?c=${code}`;
}
