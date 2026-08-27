export const FB_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '1689531238818724';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

export const pageview = () => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};

export const event = (name: string, options: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', name, options);
  }
};

// Standard Meta Pixel & Google Analytics E-Commerce Events
export const trackViewContent = ({
  id,
  name,
  category,
  price,
  currency = 'INR',
}: {
  id: string;
  name: string;
  category?: string;
  price: number;
  currency?: string;
}) => {
  event('ViewContent', {
    content_ids: [id],
    content_name: name,
    content_category: category || 'Aquatic',
    content_type: 'product',
    value: Number(price) || 0,
    currency,
  });

  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'view_item', {
      currency,
      value: Number(price) || 0,
      items: [{ item_id: id, item_name: name, item_category: category || 'Aquatic', price: Number(price) || 0 }],
    });
  }
};

export const trackAddToCart = ({
  id,
  name,
  category,
  price,
  quantity = 1,
  currency = 'INR',
}: {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
  currency?: string;
}) => {
  event('AddToCart', {
    content_ids: [id],
    content_name: name,
    content_category: category || 'Aquatic',
    content_type: 'product',
    value: (Number(price) || 0) * (Number(quantity) || 1),
    currency,
    num_items: quantity,
  });

  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'add_to_cart', {
      currency,
      value: (Number(price) || 0) * (Number(quantity) || 1),
      items: [{ item_id: id, item_name: name, item_category: category || 'Aquatic', price: Number(price) || 0, quantity }],
    });
  }
};

export const trackInitiateCheckout = ({
  value,
  currency = 'INR',
  num_items,
  content_ids,
}: {
  value: number;
  currency?: string;
  num_items?: number;
  content_ids?: string[];
}) => {
  event('InitiateCheckout', {
    value: Number(value) || 0,
    currency,
    num_items: num_items || 1,
    content_ids: content_ids || [],
    content_type: 'product',
  });

  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'begin_checkout', {
      currency,
      value: Number(value) || 0,
      items: (content_ids || []).map((id) => ({ item_id: id })),
    });
  }
};

export const trackPurchase = ({
  orderId,
  value,
  currency = 'INR',
  content_ids,
  num_items,
}: {
  orderId: string;
  value: number;
  currency?: string;
  content_ids?: string[];
  num_items?: number;
}) => {
  event('Purchase', {
    content_type: 'product',
    content_ids: content_ids || [],
    value: Number(value) || 0,
    currency,
    num_items: num_items || 1,
    order_id: orderId,
  });

  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'purchase', {
      transaction_id: orderId,
      value: Number(value) || 0,
      currency,
      items: (content_ids || []).map((id) => ({ item_id: id })),
    });
  }
};

export const trackSearch = ({ search_string }: { search_string: string }) => {
  if (!search_string) return;
  event('Search', {
    search_string,
  });

  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'search', {
      search_term: search_string,
    });
  }
};
