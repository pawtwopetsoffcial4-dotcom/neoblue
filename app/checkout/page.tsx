"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { Trash2, Plus, Minus, MapPin, ShoppingBag, ArrowRight, ShieldCheck, ArrowLeft, CheckSquare, AlertCircle } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/types/marketplace';
import { getRegionFromState, getShippingChargeForWeight } from '@/lib/utils/shipping';
import { useMode } from '@/lib/hooks/useMode';

const PENDING_CASHFREE_CHECKOUT_KEY = 'pendingCashfreeCheckout';

const cashfreeSdkSrc = 'https://sdk.cashfree.com/js/v3/cashfree.js';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isPaying, setIsPaying] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [productDetails, setProductDetails] = useState<Record<string, MarketplaceProduct>>({});
  const { mode } = useMode();
  const isPlants = mode === 'plants';

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
  const [address, setAddress] = useState({ street: '', city: '', state: '', zipcode: '', phone: '' });


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

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
          setAddress({
            street: saved.street,
            city: saved.city,
            state: saved.state,
            zipcode: saved.zipcode,
            phone: response?.phone || '',
          });
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

        const rawPending = localStorage.getItem(PENDING_CASHFREE_CHECKOUT_KEY);
        if (!rawPending) {
          return;
        }

        const pending = JSON.parse(rawPending) as {
          orderId: string;
          products: Array<{ productId: string; quantity: number }>;
          address: { street: string; city: string; state: string; zipcode: string };
        };

        if (!pending?.orderId || pending.orderId !== cashfreeOrderId) {
          return;
        }

        const verifyData = await apiClient.request<{
          orderId: string;
          orderStatus: string;
          paymentStatus: string;
          cfPaymentId?: string | null;
          isPaid?: boolean;
        }>(`/checkout/verify-order?orderId=${encodeURIComponent(cashfreeOrderId)}`);

        if (!verifyData?.isPaid) {
          alert('Payment was not completed. Please try again.');
          return;
        }

        await apiClient.createOrder({
          products: pending.products,
          address: pending.address,
          paymentId: verifyData.cfPaymentId || cashfreeOrderId,
          cashfreeOrderId,
        });

        localStorage.removeItem(PENDING_CASHFREE_CHECKOUT_KEY);
        clearCart();
        router.replace('/orders?payment=success');
      } catch {
        alert('Unable to verify payment. Please contact support if amount was deducted.');
      } finally {
        setIsFinalizing(false);
      }
    };

    finalizeCheckout();
  }, [searchParams, router, clearCart, isFinalizing]);

  const cartQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Group cart items by vendor for shipping calculation
  const region = getRegionFromState(address.state);
  const vendorShippingGroups: Record<string, { totalWeight: number; vendor: any }> = {};
  let isLocationServiceable = true;
  let nonServiceableMessage = '';

  items.forEach((item) => {
    const product = productDetails[item.productId];
    if (!product) return;
    const vendor = (typeof product.vendorId === 'object' && product.vendorId !== null ? product.vendorId : null) as any;
    const vId = vendor?._id || (typeof product.vendorId === 'string' ? product.vendorId : '');
    if (!vId) return;

    if (!vendorShippingGroups[vId]) {
      vendorShippingGroups[vId] = { totalWeight: 0, vendor };
    }
    const qty = item.quantity;
    const weight = product.weightPerPiece || 0;
    vendorShippingGroups[vId].totalWeight += weight * qty;

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
  });

  const shippingAmount = Object.values(vendorShippingGroups).reduce((sum, group) => {
    return sum + getShippingChargeForWeight(group.totalWeight, region, group.vendor, address.state);
  }, 0);

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

    if (!address.street || !address.city || !address.state || !address.zipcode || !address.phone) {
      alert('Please fill all delivery details including phone number.');
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
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Cart Items ({items.length})</h2>
                  <button onClick={clearCart} className="text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4" /> Clear All
                  </button>
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
                          <p className="text-sm text-gray-500 mt-1 font-medium">₹{item.price.toFixed(2)} / each</p>
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

                              const itemShipping = getShippingChargeForWeight(
                                (product.weightPerPiece || 0) * item.quantity,
                                region,
                                vendor,
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
                      <span>₹{shippingAmount.toFixed(2)}</span>
                    </div>

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
