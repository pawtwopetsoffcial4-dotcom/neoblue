"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { Trash2, Plus, Minus, MapPin, ShoppingBag, ArrowRight, ShieldCheck, ArrowLeft, CheckSquare, AlertCircle, Share2, Copy, Check, MessageCircle, X } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { getRegionFromState, getProductShippingCharge, checkFreeShippingEligibility } from '@/lib/utils/shipping';
import { useMode } from '@/lib/hooks/useMode';
import { decodeSharedCart, getShareableCartUrl, createShortShareCode, resolveSharedCartCode, buildShareableUrl, type SharedCartItem } from '@/lib/utils/cartShare';
import { trackInitiateCheckout, trackPurchase } from '@/lib/fpixel';

const PENDING_CASHFREE_CHECKOUT_KEY = 'pendingCashfreeCheckout';

const cashfreeSdkSrc = 'https://sdk.cashfree.com/js/v3/cashfree.js';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart, loadSharedCart } = useCart();
  const [isPaying, setIsPaying] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [productDetails, setProductDetails] = useState<Record<string, MarketplaceProduct>>({});
  const { mode } = useMode();
  const isPlants = mode === 'plants';

  // Cart Sharing State
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedCartItems, setSharedCartItems] = useState<SharedCartItem[] | null>(null);
  const [sharedCartDismissed, setSharedCartDismissed] = useState(false);
  const [shortShareUrl, setShortShareUrl] = useState<string>('');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  useEffect(() => {
    const rawShared = searchParams.get('c') || searchParams.get('shared_cart');
    if (!rawShared) return;

    let isMounted = true;

    const resolveSharedCart = async () => {
      try {
        const decoded = await resolveSharedCartCode(rawShared);
        if (!decoded || decoded.length === 0) return;

        const resolved: SharedCartItem[] = await Promise.all(
          decoded.map(async (item) => {
            let details = productDetails[item.productId];
            if (!details) {
              try {
                const res = (await apiClient.getProduct(item.productId)) as any;
                details = res?.product || res;
              } catch (e) {
                console.error('Failed to fetch shared product details:', e);
              }
            }

            return {
              productId: item.productId,
              quantity: item.quantity,
              title: details?.title || 'Aquatic Product',
              price: details?.price || 0,
              image: details?.images?.[0] || '/illustrations/placeholder.png',
            };
          })
        );

        if (isMounted) {
          setSharedCartItems(resolved);
        }
      } catch (err) {
        console.error('Failed to resolve shared cart:', err);
      }
    };

    resolveSharedCart();

    return () => {
      isMounted = false;
    };
  }, [searchParams, productDetails]);

  const generateShareLink = async () => {
    if (shortShareUrl) return shortShareUrl;
    setIsGeneratingShare(true);
    try {
      const code = await createShortShareCode(items);
      const url = buildShareableUrl(code);
      setShortShareUrl(url);
      setIsGeneratingShare(false);
      return url;
    } catch (e) {
      const fallback = getShareableCartUrl(items);
      setShortShareUrl(fallback);
      setIsGeneratingShare(false);
      return fallback;
    }
  };

  const handleOpenShareModal = async () => {
    setShowShareModal(true);
    await generateShareLink();
  };

  const shareableUrl = shortShareUrl || getShareableCartUrl(items);

  const handleCopyLink = async () => {
    try {
      const url = await generateShareLink();
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error('Failed to copy share link:', e);
    }
  };

  const handleNativeShare = async () => {
    const url = await generateShareLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My NeoBlue Cart',
          text: `Check out these ${items.length} item(s) in my NeoBlue cart!`,
          url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const textTheme = isPlants ? 'text-green-700' : 'text-blue-600';
  const textThemeHover = isPlants ? 'hover:text-green-800' : 'hover:text-blue-700';
  const textThemeDark = isPlants ? 'text-green-800' : 'text-blue-800';
  const bgTheme = isPlants ? 'bg-green-700' : 'bg-blue-600';
  const bgThemeHover = isPlants ? 'hover:bg-green-800' : 'hover:bg-blue-700';
  const bgThemeLight = isPlants ? 'bg-green-50' : 'bg-blue-50';
  const bgThemeLight70 = isPlants ? 'bg-green-50/70' : 'bg-blue-50/70';
  const bgThemeLight50 = isPlants ? 'bg-green-50/50' : 'bg-blue-50/50';
  const borderThemeLight = isPlants ? 'border-green-100' : 'border-blue-100';
  const borderThemeLight50 = isPlants ? 'border-green-100/50' : 'border-blue-100/50';
  const borderThemeTop = isPlants ? 'border-t-green-700' : 'border-t-blue-600';
  const focusRingTheme = isPlants ? 'focus:ring-green-500 focus:border-green-500' : 'focus:ring-blue-500 focus:border-blue-500';
  const shadowTheme = isPlants ? 'shadow-green-500/20' : 'shadow-blue-500/20';
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [savedAddress, setSavedAddress] = useState<{ street: string; city: string; state: string; zipcode: string; phone: string } | null>(null);
  const [useSavedAddress, setUseSavedAddress] = useState<boolean>(true);
  const [address, setAddress] = useState({ street: '', city: '', state: '', zipcode: '', phone: '' });
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = (await apiClient.getStoreConfig()) as any;
        if (res) setStoreConfig(res);
      } catch (e) {
        console.error('Failed to load store config in checkout:', e);
      }
    };
    loadConfig();
  }, []);




  useEffect(() => {
    const loadSavedAddress = async () => {
      try {
        const token = localStorage.getItem('authToken') ?? '';
        if (!token) {
          return;
        }

        const response = await apiClient.request<{
          defaultAddress?: { street: string; city: string; state: string; zipcode: string } | null;
          phone?: string;
        }>('/profile/address');

        const saved = response?.defaultAddress;
        if (saved?.street && saved?.city && saved?.state && saved?.zipcode) {
          const fullSaved = {
            street: saved.street,
            city: saved.city,
            state: saved.state,
            zipcode: saved.zipcode,
            phone: response?.phone || '',
          };
          setSavedAddress(fullSaved);
          setUseSavedAddress(true);
          setAddress(fullSaved);
        } else if (response?.phone) {
          setAddress((prev) => ({ ...prev, phone: response.phone || '' }));
        }
      } catch (error) {
        console.error('Error loading saved address:', error);
      }
    };

    loadSavedAddress();

    const missingIds = items
      .map((item) => item.productId)
      .filter((productId) => !productDetails[productId]);

    if (missingIds.length === 0) {
      return;
    }

    let cancelled = false;

    const fetchProductDetails = async () => {
      try {
        const token = localStorage.getItem('authToken') ?? '';
        const responses = await Promise.all(
          missingIds.map(async (productId) => {
            const res = await fetch(`/api/products/${productId}`, {
              cache: 'no-store',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!res.ok) {
              return null;
            }

            const data = await res.json();
            return data?.product ?? null;
          })
        );

        if (cancelled) {
          return;
        }

        const nextDetails: Record<string, MarketplaceProduct> = {};
        responses.forEach((product) => {
          if (product?._id) {
            nextDetails[product._id] = product;
          }
        });

        if (Object.keys(nextDetails).length > 0) {
          setProductDetails((current) => ({ ...current, ...nextDetails }));
        }
      } catch (error) {
        console.error('Error fetching product shipping details:', error);
      }
    };

    fetchProductDetails();

    return () => {
      cancelled = true;
    };
  }, [items, productDetails]);



  useEffect(() => {
    const cashfreeOrderId = searchParams.get('cashfree_order_id');
    if (!cashfreeOrderId || isFinalizing) return;

    const finalizeCheckout = async () => {
      try {
        setIsFinalizing(true);

        // Sanitize URL query parameters immediately so returning to /checkout never re-triggers verification or alerts!
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const verifyData = await apiClient.request<{
          orderId: string;
          orderStatus: string;
          paymentStatus: string;
          cfPaymentId?: string | null;
          isPaid?: boolean;
        }>(`/checkout/verify-order?orderId=${encodeURIComponent(cashfreeOrderId)}`);

        if (!verifyData?.isPaid) {
          setPaymentErrorMessage('Payment was not completed or was cancelled. Your items are still saved in your bag so you can try again.');
          return;
        }

        const rawPending = localStorage.getItem(PENDING_CASHFREE_CHECKOUT_KEY);
        if (rawPending) {
          try {
            const pending = JSON.parse(rawPending);
            if (pending?.products && pending?.address) {
              await apiClient.createOrder({
                products: pending.products,
                address: pending.address,
                paymentId: verifyData.cfPaymentId || cashfreeOrderId,
                cashfreeOrderId,
              }).catch(() => {});
            }
          } catch (e) {
            console.error('Pending order backup error:', e);
          }
        }

        trackPurchase({
          orderId: cashfreeOrderId,
          value: totalAmount || (verifyData as any)?.orderAmount || 0,
          currency: 'INR',
          content_ids: items.map((i) => i.productId),
          num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        });

        localStorage.removeItem(PENDING_CASHFREE_CHECKOUT_KEY);
        clearCart();
        router.replace(`/orders?confirmed=true&order_id=${encodeURIComponent(cashfreeOrderId)}`);
      } catch (err: any) {
        console.error('Finalizing checkout error:', err);
        setPaymentErrorMessage('Unable to verify payment status. If payment was deducted, please check your My Orders page.');
      } finally {
        setIsFinalizing(false);
      }
    };

    finalizeCheckout();
  }, [searchParams, router, clearCart, isFinalizing]);

  // Track Meta Pixel InitiateCheckout
  useEffect(() => {
    if (items.length > 0) {
      trackInitiateCheckout({
        value: totalAmount,
        currency: 'INR',
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        content_ids: items.map((i) => i.productId),
      });
    }
  }, []); // Run once on initial checkout mount

  const cartQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Group cart items by vendor for shipping calculation
  const region = getRegionFromState(address.state);
  let isLocationServiceable = true;
  let nonServiceableMessage = '';
  let shippingAmount = 0;
  // Free Shipping Calculation Check
  const freeShippingInfo = checkFreeShippingEligibility(
    totalAmount,
    items,
    productDetails,
    storeConfig
  );

  items.forEach((item) => {
    const product = productDetails[item.productId];
    if (!product) return;
    const vendor = (typeof product.vendorId === 'object' && product.vendorId !== null ? product.vendorId : null) as any;

    // Check non-serviceable states and regional switches
    const nonServiceable = vendor?.nonServiceableStates || [];
    if (address.state && nonServiceable.some((s: string) => s.toLowerCase().trim() === address.state.toLowerCase().trim())) {
      isLocationServiceable = false;
      nonServiceableMessage = `Sorry, this product cannot be delivered to your location.`;
    }
    if (region === 'North' && vendor?.deliverNorth === false) {
      isLocationServiceable = false;
      nonServiceableMessage = `Sorry, this product cannot be delivered to your location.`;
    }
    if (region === 'South' && vendor?.deliverSouth === false) {
      isLocationServiceable = false;
      nonServiceableMessage = `Sorry, this product cannot be delivered to your location.`;
    }

    const itemShipping = getProductShippingCharge(product, item.quantity, address.state);
    shippingAmount += itemShipping;
  });

  if (freeShippingInfo.isEligible) {
    shippingAmount = 0;
  }

  const orderTotal = totalAmount + shippingAmount;

  const handlePayNow = async () => {
    if (!user || user.role !== 'user') {
      alert('Please login as a customer to place an order.');
      return;
    }

    if (items.length === 0) {
      alert('Cart is empty.');
      return;
    }

    if (shippingAmount <= 0 && !freeShippingInfo.isEligible) {
      alert('Shipping charges are compulsory for every order. It seems the vendor has not configured shipping rates for your location.');
      return;
    }

    if (!address.street || !address.city || !address.state || !address.zipcode || !address.phone) {
      alert('Please fill all delivery details including phone number.');
      return;
    }

    if (!agreeToPolicy) {
      alert('Please read and accept the Live Arrival Guarantee, Return Policy, and Terms to proceed.');
      return;
    }

    try {
      setIsPaying(true);

      if (saveAddress) {
        try {
          setIsSavingAddress(true);
          await apiClient.request('/profile/address', {
            method: 'POST',
            body: JSON.stringify({
              street: address.street,
              city: address.city,
              state: address.state,
              zipcode: address.zipcode,
              phone: address.phone,
              isDefault: true,
            }),
          });
        } catch (error) {
          console.error('Saving address failed:', error);
        } finally {
          setIsSavingAddress(false);
        }
      }

      const products = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const cashfreeOrder = await apiClient.request<{
        orderId: string;
        amount: number;
        currency: string;
        paymentSessionId?: string;
        paymentLink?: string;
        environment?: 'production' | 'sandbox';
      }>('/checkout/create-order', {
        method: 'POST',
        body: JSON.stringify({ products, address }),
      });

      if (!cashfreeOrder?.orderId) {
        throw new Error('Failed to initialize Cashfree order');
      }

      localStorage.setItem(
        PENDING_CASHFREE_CHECKOUT_KEY,
        JSON.stringify({
          orderId: cashfreeOrder.orderId,
          products,
          address,
        })
      );

      // Prefer hosted payment link when Cashfree returns one.
      if (cashfreeOrder.paymentLink) {
        window.location.href = cashfreeOrder.paymentLink;
        return;
      }

      if (!cashfreeOrder.paymentSessionId) {
        throw new Error('Cashfree payment session is unavailable. Please contact support.');
      }

      if (typeof window.Cashfree !== 'function') {
        throw new Error('Cashfree checkout library is unavailable. Please refresh and try again.');
      }

      const cashfree = window.Cashfree({ mode: cashfreeOrder.environment === 'production' ? 'production' : 'sandbox' });
      await cashfree.checkout({
        paymentSessionId: cashfreeOrder.paymentSessionId,
        redirectTarget: '_self',
      });
    } catch (error) {
      console.error('Payment initialization failed:', error);
      alert(error instanceof Error ? error.message : 'Payment initialization failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const isDeliveryBlocked = !isLocationServiceable;

  const isSharedCartMode = Boolean(searchParams.get('c') || searchParams.get('shared_cart'));

  if (isSharedCartMode && sharedCartItems) {
    const sharedSubtotal = sharedCartItems.reduce((s, i) => s + i.price * i.quantity, 0);

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 pb-24 font-sans">
        {/* Header section */}
        <div className="bg-white border-b border-gray-200 pt-8 pb-8 md:pt-12 md:pb-12 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-medium">
              <Link href="/" className={`hover:${textTheme} transition-colors`}>Home</Link>
              <span>/</span>
              <span className="text-gray-900">Shared Cart Preview</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${bgThemeLight} ${textTheme} flex items-center justify-center shrink-0 text-2xl`}>
                🛒
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950">
                  Shared Cart Overview
                </span>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-gray-900 mt-1">
                  Shared Products Selection
                </h1>
              </div>
            </div>
            <p className="text-gray-500 mt-2 font-medium text-xs sm:text-sm">
              Below is the read-only overview of the products, quantities, and total amount in this shared cart. No login required.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Shared Items ({sharedCartItems.length})
              </h2>
              <span className="text-xs font-semibold text-slate-500">Read-Only View</span>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {sharedCartItems.map((item) => (
                <article key={item.productId} className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                    <img src={item.image || '/illustrations/placeholder.png'} alt={item.title} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          ₹{item.price.toFixed(2)} / {(item as any).perPairPrice != null || (item as any).unitLabel === 'pair' ? 'pair' : 'piece'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-base sm:text-lg text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                        <span className="inline-block mt-1 text-[11px] font-extrabold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Shared Cart Summary Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Shared Amount</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">₹{sharedSubtotal.toFixed(2)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    loadSharedCart(sharedCartItems as any, 'replace');
                    setSharedCartItems(null);
                    if (typeof window !== 'undefined') {
                      window.history.replaceState({}, '', '/checkout');
                    }
                  }}
                  className="h-11 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  📋 Paste Cart to My Bag
                </button>
                <Link
                  href="/products"
                  className={`h-11 px-5 rounded-2xl ${bgTheme} text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2`}
                >
                  Browse Products <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24 md:pb-32 font-sans">
      <Script src={cashfreeSdkSrc} strategy="afterInteractive" />
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-8 md:pt-12 md:pb-12 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-medium">
            <Link href="/" className={`hover:${textTheme} transition-colors`}>Home</Link>
            <span>/</span>
            <span className="text-gray-900">Cart & Checkout</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <ShoppingBag className={`h-8 w-8 md:h-10 md:w-10 ${textTheme}`} />
            Your Cart
          </h1>
          <p className="text-gray-500 mt-2 font-medium max-w-xl">
            Review your aquatic items and provide your delivery details below to proceed with the secure checkout process.
          </p>
        </div>
      </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-10">
          {/* Payment Cancellation / Failure Banner */}
          {paymentErrorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  ⚠️
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">Checkout Notification</h4>
                  <p className="text-xs font-semibold text-amber-800 mt-0.5">{paymentErrorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentErrorMessage(null)}
                className="text-amber-500 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Shared Cart Banner (when receiving a shared link) */}
          {sharedCartItems && !sharedCartDismissed && (
            <div className="bg-slate-900 text-white rounded-3xl p-5 md:p-6 shadow-xl mb-8 border border-slate-800 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-amber-400 font-bold text-xl">
                    🛒
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                      Shared Cart Link
                    </span>
                    <h2 className="text-base md:text-lg font-black text-white mt-1">Someone shared a cart with you! ({sharedCartItems.length} items)</h2>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">
                      Subtotal: <strong>₹{sharedCartItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</strong> • Load these products directly into your bag to checkout.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      loadSharedCart(sharedCartItems as any, 'merge');
                      setSharedCartDismissed(true);
                    }}
                    className="h-9 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Add to My Cart
                  </button>
                  <button
                    onClick={() => {
                      loadSharedCart(sharedCartItems as any, 'replace');
                      setSharedCartDismissed(true);
                    }}
                    className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-colors border border-white/20 cursor-pointer"
                  >
                    Replace Cart
                  </button>
                  <button
                    onClick={() => setSharedCartDismissed(true)}
                    className="h-9 px-3 rounded-xl text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm max-w-2xl mx-auto mt-12">
            <div className={`w-24 h-24 ${bgThemeLight} ${isPlants ? 'text-green-600' : 'text-blue-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Looks like you haven't added any premium aquatic life or supplies to your cart yet.
            </p>
            <Link href="/products" className={`inline-flex h-12 px-8 items-center justify-center rounded-full ${bgTheme} text-white font-bold ${bgThemeHover} transition-all shadow-sm gap-2`}>
              Browse Products <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-gray-900">Cart Items ({items.length})</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleOpenShareModal}
                      className={`text-xs font-extrabold ${textTheme} hover:opacity-80 transition-opacity flex items-center gap-1.5 bg-white border ${borderThemeLight} px-3 py-1.5 rounded-xl shadow-xs cursor-pointer`}
                    >
                      <Share2 className="h-3.5 w-3.5" /> Share Cart
                    </button>
                    <button onClick={clearCart} className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" /> Clear All
                    </button>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 space-y-6">
                  {items.map((item) => (
                    <article key={item.productId} className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-bold text-lg text-gray-900 leading-tight truncate">{item.title}</h3>
                            <p className="font-bold text-lg text-gray-900 shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          {(() => {
                            const product = productDetails[item.productId];
                            const isPair = product?.perPairPrice != null || (item as any).perPairPrice != null || (item as any).unitLabel === 'pair';
                            return (
                              <p className="text-sm text-gray-500 mt-1 font-medium">
                                ₹{item.price.toFixed(2)} / {isPair ? 'pair' : 'piece'}
                              </p>
                            );
                          })()}
                          {productDetails[item.productId] ? (
                            (() => {
                              const product = productDetails[item.productId];
                              const vendor = (typeof product.vendorId === 'object' && product.vendorId !== null ? product.vendorId : null) as any;
                              const nonServiceable = vendor?.nonServiceableStates || [];
                              const isRestricted = address.state && nonServiceable.some((s: string) => s.toLowerCase().trim() === address.state.toLowerCase().trim());

                              if (isRestricted) {
                                return (
                                  <div className="mt-3 bg-rose-50 rounded-2xl border border-rose-100 p-3.5 flex items-start gap-2.5 text-rose-700">
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-xs font-bold">Delivery Unavailable</p>
                                      <p className="text-[11px] font-medium mt-0.5">
                                        Sorry, this product cannot be delivered to your location.
                                      </p>
                                    </div>
                                  </div>
                                );
                              }

                              const itemShipping = getProductShippingCharge(
                                product,
                                item.quantity,
                                address.state
                              );

                              return (
                                <div className="mt-1 space-y-0.5">
                                  <p className="text-xs text-gray-400 font-medium">
                                    Weight: {product.weightPerPiece || 0} gm per piece
                                  </p>
                                  <p className="text-xs text-slate-500 font-bold">
                                    Est. Shipping: ₹{itemShipping.toFixed(2)}
                                  </p>
                                </div>
                              );
                            })()
                          ) : (
                            <p className="text-xs text-gray-400 mt-1 font-medium">Loading shipping...</p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full p-1">
                            <button 
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)} 
                              className="h-8 w-8 rounded-full bg-white text-gray-600 shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                              className="h-8 w-8 rounded-full bg-white text-gray-600 shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(item.productId)} 
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <Link href="/products" className={`inline-flex items-center text-sm font-bold ${textTheme} ${textThemeHover} w-fit gap-2 px-2 py-4`}>
                <ArrowLeft className="h-4 w-4" /> Continue Shopping
              </Link>
            </div>

            {/* Right Column: Checkout & Address */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-24">
              
              {/* Address Form */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <MapPin className={`h-5 w-5 ${textTheme}`} />
                  <h2 className="text-lg font-bold text-gray-900">Delivery Details</h2>
                </div>
                <div className="p-6 space-y-4">
                  {/* Saved Address Choice Selector if user has saved address */}
                  {savedAddress ? (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Select Delivery Address</label>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setUseSavedAddress(true);
                            setAddress(savedAddress);
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            useSavedAddress
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-200 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <CheckSquare className="h-4 w-4 text-blue-600" /> Use Saved Address
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">Default</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 mt-1.5 leading-snug">
                            {savedAddress.street}, {savedAddress.city}, {savedAddress.state} - {savedAddress.zipcode}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500 mt-1">Phone: {savedAddress.phone}</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUseSavedAddress(false);
                            setAddress({ street: '', city: '', state: '', zipcode: '', phone: savedAddress.phone || '' });
                          }}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            !useSavedAddress
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-200 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-slate-500" /> Deliver to a Different Address
                          </span>
                        </button>
                      </div>

                      {!useSavedAddress && (
                        <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Street Address</label>
                            <input 
                              className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                              placeholder="123 Ocean Avenue, Apt 4B" 
                              value={address.street} 
                              onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))} 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                              <input 
                                className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                                placeholder="Mumbai" 
                                value={address.city} 
                                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))} 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                              <input 
                                className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                                placeholder="Maharashtra" 
                                value={address.state} 
                                onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))} 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zipcode</label>
                              <input 
                                className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                                placeholder="400001" 
                                value={address.zipcode} 
                                onChange={(e) => setAddress((prev) => ({ ...prev, zipcode: e.target.value }))} 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                              <input 
                                type="tel"
                                className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                                placeholder="9999999999" 
                                value={address.phone} 
                                onChange={(e) => setAddress((prev) => ({ ...prev, phone: e.target.value }))} 
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Street Address</label>
                        <input 
                          className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                          placeholder="123 Ocean Avenue, Apt 4B" 
                          value={address.street} 
                          onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                          <input 
                            className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                            placeholder="Mumbai" 
                            value={address.city} 
                            onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))} 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                          <input 
                            className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                            placeholder="Maharashtra" 
                            value={address.state} 
                            onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))} 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zipcode</label>
                          <input 
                            className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                            placeholder="400001" 
                            value={address.zipcode} 
                            onChange={(e) => setAddress((prev) => ({ ...prev, zipcode: e.target.value }))} 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                          <input 
                            type="tel"
                            className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 ${focusRingTheme} outline-none transition-all font-medium placeholder:text-gray-400 text-gray-900`} 
                            placeholder="9999999999" 
                            value={address.phone} 
                            onChange={(e) => setAddress((prev) => ({ ...prev, phone: e.target.value }))} 
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <label className={`flex items-start gap-3 rounded-2xl border ${borderThemeLight} ${bgThemeLight70} p-4`}>
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className={`mt-1 h-4 w-4 rounded ${isPlants ? 'border-green-300 text-green-600 focus:ring-green-500' : 'border-blue-300 text-blue-600 focus:ring-blue-500'}`}
                    />
                    <span className="text-sm text-slate-700">
                      <span className="block font-bold text-slate-900">Save this address</span>
                      <span className="block mt-1 text-slate-500">Use it automatically next time for faster checkout.</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Order Summary */}
              <div className={`bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden border-t-4 ${borderThemeTop}`}>
                <div className="p-6 md:p-8 space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Order Summary</h2>
                  
                  <div className="space-y-3 font-medium text-gray-600 border-b border-gray-100 pb-6">
                    <div className="flex justify-between items-center">
                      <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} items)</span>
                      <span className="text-gray-900">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Shipping from products</span>
                      <span>{freeShippingInfo.isEligible ? <strong className="text-emerald-600 font-extrabold uppercase">FREE</strong> : `₹${shippingAmount.toFixed(2)}`}</span>
                    </div>

                    {freeShippingInfo.isEligible && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <span className="text-base">🎉</span>
                        <span>Free Shipping Applied! (Single-seller order over ₹{freeShippingInfo.minAmount})</span>
                      </div>
                    )}

                    {freeShippingInfo.enabled && freeShippingInfo.isSingleVendor && !freeShippingInfo.isEligible && freeShippingInfo.remainingAmount > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                        <span className="text-base">🚚</span>
                        <span>Add <strong>₹{freeShippingInfo.remainingAmount.toFixed(0)}</strong> more of <strong>{freeShippingInfo.vendorName}</strong>&apos;s items for FREE Shipping!</span>
                      </div>
                    )}

                  </div>

                  <div className="flex justify-between items-end py-2">
                    <span className="text-lg font-bold text-gray-900">Total Price</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-gray-900 block leading-none">₹{orderTotal.toFixed(2)}</span>
                      <span className="text-xs text-gray-500 mt-1 block">Includes Live Arrival protection</span>
                    </div>
                  </div>

                  {isDeliveryBlocked && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-rose-600 text-xs">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Delivery Blocked</p>
                        <p className="font-semibold mt-0.5">{nonServiceableMessage || "Sorry, this product cannot be delivered to your location."}</p>
                      </div>
                    </div>
                  )}

                  {/* Bio-security and Live Arrival Policies */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Required Policy Checklist</h3>
                    
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-[11px] text-slate-600 leading-relaxed max-h-36 overflow-y-auto">
                      <div>
                        <p className="font-extrabold text-slate-800">1. Live Arrival Guarantee (DOA)</p>
                        <p className="mt-0.5">We guarantee all live specimens arrive healthy. In the rare event of a Dead-on-Arrival (DOA), you must submit a clear unboxing photo/video of the unopened bag within 2 hours of delivery for a full credit/replacement.</p>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800">2. Strict Biosecurity Policy (No Returns)</p>
                        <p className="mt-0.5">To prevent disease transmission and cross-contamination between aquatic systems, physical returns of live livestock, invertebrates, or aquatic plants are strictly prohibited. All sales are final.</p>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800">3. Transit Care & Dispatches</p>
                        <p className="mt-0.5">Livestock is packaged in insulated styrofoam boxes with oxygenation and appropriate heat/ice packs. Orders are shipped via priority express courier routes.</p>
                      </div>
                    </div>

                    <label className={`flex items-start gap-2.5 cursor-pointer select-none rounded-xl p-3 border transition-all duration-300 ${
                      agreeToPolicy 
                        ? (isPlants ? 'border-green-200 bg-green-50/20' : 'border-blue-200 bg-blue-50/20') 
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}>
                      <input 
                        type="checkbox"
                        checked={agreeToPolicy}
                        onChange={(e) => setAgreeToPolicy(e.target.checked)}
                        className={`mt-0.5 h-4 w-4 rounded ${isPlants ? 'border-green-300 text-green-600 focus:ring-green-500' : 'border-blue-300 text-blue-600 focus:ring-blue-500'}`}
                      />
                      <span className="text-[11px] font-bold text-slate-700 leading-tight">
                        I agree to the Live Arrival Guarantee, Strict No-Return Policy, and Shipping terms.
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={handlePayNow}
                    disabled={isPaying || isFinalizing || items.length === 0 || isDeliveryBlocked}
                    className={`w-full h-14 rounded-2xl ${bgTheme} text-white font-bold text-lg ${bgThemeHover} transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${shadowTheme} active:scale-[0.98]`}
                  >
                    {isPaying || isFinalizing ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {isSavingAddress ? 'Saving address...' : isFinalizing ? 'Verifying payment...' : 'Processing...'}
                      </span>
                    ) : (
                      <>Checkout Securely <ArrowRight className="h-5 w-5" /></>
                    )}
                  </button>
                  
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 mt-4 uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" /> 100% SECURE CASHFREE
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 🚀 Share Cart Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-2">
              <div className={`w-11 h-11 rounded-2xl ${bgThemeLight} ${textTheme} flex items-center justify-center shrink-0`}>
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Share Your Cart</h3>
                <p className="text-xs text-slate-500 font-medium">Allow anyone to view or buy the {items.length} item(s) in your bag</p>
              </div>
            </div>

            <div className="space-y-3 mt-5">
              {/* WhatsApp Share Button */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my NeoBlue cart (${items.length} items): ${shareableUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 fill-current" /> Share on WhatsApp
              </a>

              {/* Native Share / Copy Button */}
              <button
                onClick={handleNativeShare}
                className="w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Shareable Link'}
              </button>

              {/* URL Input Display */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Share Link</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="bg-transparent text-xs font-semibold text-slate-700 w-full outline-none select-all truncate px-1"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
