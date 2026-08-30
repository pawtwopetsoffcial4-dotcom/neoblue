import type { CartItem } from '@/lib/hooks/useCart';

export type SharedCartItem = {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  unitLabel?: string;
  packQty?: number;
};

export type ShortCartItem = {
  productId: string;
  quantity: number;
  unitLabel?: string;
  packQty?: number;
};

/**
 * Fallback: Encodes cart items into an inline string format ("id1:qty1~id2:qty2").
 */
export function encodeSharedCart(items: CartItem[]): string {
  if (!items || items.length === 0) return '';
  return items.map((item) => `${item.productId}:${item.quantity}`).join('~');
}

/**
 * Creates an ultra-short 6-character code via API (/api/cart/share).
 */
export async function createShortShareCode(items: CartItem[]): Promise<string> {
  if (!items || items.length === 0) return '';
  try {
    const res = await fetch('/api/cart/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.code) return data.code;
    }
  } catch (err) {
    console.error('Failed to create short share code via API:', err);
  }
  return encodeSharedCart(items);
}

/**
 * Resolves short cart code (either 6-char API code "A9X2B1" or inline "id1:qty1~id2:qty2").
 */
export async function resolveSharedCartCode(code: string): Promise<ShortCartItem[] | null> {
  if (!code) return null;

  // 1. Try 6-character short code via API
  if (/^[A-Z0-9]{6}$/i.test(code.trim())) {
    try {
      const res = await fetch(`/api/cart/share?code=${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.items)) {
          return data.items;
        }
      }
    } catch (e) {
      console.error('Error resolving short code via API:', e);
    }
  }

  // 2. Inline string format ("id1:qty1~id2:qty2") or legacy base64 format
  return decodeSharedCart(code);
}

/**
 * Decodes short cart string ("id1:qty1~id2:qty2") or legacy base64 format into ShortCartItem array.
 */
export function decodeSharedCart(encoded: string): ShortCartItem[] | null {
  if (!encoded) return null;
  try {
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
 * Generates full shareable URL for a code.
 */
export function buildShareableUrl(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://neoblue.in';
  return `${origin}/checkout?c=${code}`;
}

export function getShareableCartUrl(items: CartItem[]): string {
  const code = encodeSharedCart(items);
  if (!code) return '';
  return buildShareableUrl(code);
}
