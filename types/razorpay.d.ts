export {};

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description?: string;
      order_id: string;
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => void | Promise<void>;
      prefill?: { name?: string; email?: string; contact?: string };
      theme?: { color?: string };
      modal?: { ondismiss?: () => void };
      notes?: Record<string, string>;
    }) => { open: () => void; close?: () => void };
    Cashfree?: any;
  }
}

