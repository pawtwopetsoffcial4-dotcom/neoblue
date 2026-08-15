"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/useAuth';
import { CldUploadWidget } from 'next-cloudinary';
import { Shield, ShieldCheck, ShieldAlert, FileVideo, UploadCloud, CheckCircle2, AlertCircle, Loader2, X, ShoppingBag, ArrowRight } from 'lucide-react';

type UserOrder = {
  _id: string;
  totalAmount: number;
  shippingAmount?: number;
  status: 'placed' | 'accepted' | 'preparing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
  carrier?: string;
  trackingNumber?: string;
  trackingLink?: string;
  products: Array<{
    productId: {
      _id: string;
      title: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
};

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isConfirmed = searchParams.get('confirmed') === 'true' || searchParams.get('payment') === 'success';

  // Claim Form State
  const [activeClaimOrder, setActiveClaimOrder] = useState<UserOrder | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [productId: string]: { selected: boolean; quantity: number; reason: string } }>({});
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [claimDescription, setClaimDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, claimsRes] = await Promise.all([
        apiClient.getOrders(),
        apiClient.getClaims().catch(() => ({ claims: [] })),
      ]);
      setOrders((ordersRes as { orders: UserOrder[] }).orders ?? []);
      setClaims((claimsRes as { claims: any[] }).claims ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadData();
  }, [isAuthenticated, isAuthLoading, router]);

  const openClaimModal = (order: UserOrder) => {
    setActiveClaimOrder(order);
    const initialItems: typeof selectedItems = {};
    order.products.forEach((p) => {
      if (p.productId) {
        initialItems[p.productId._id] = {
          selected: true,
          quantity: p.quantity,
          reason: 'Dead on Arrival (DOA)',
        };
      }
    });
    setSelectedItems(initialItems);
    setUploadedUrls([]);
    setClaimDescription('');
    setFormError('');
  };

  const handleItemCheckboxChange = (productId: string, val: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: val,
      },
    }));
  };

  const handleItemQuantityChange = (productId: string, qty: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: qty,
      },
    }));
  };

  const handleItemReasonChange = (productId: string, reason: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        reason,
      },
    }));
  };

  const handleClaimSubmit = async () => {
    if (!activeClaimOrder) return;
    setFormError('');

    // Check if at least one item selected
    const itemsToClaim = Object.keys(selectedItems)
      .filter((k) => selectedItems[k].selected)
      .map((k) => ({
        productId: k,
        quantity: selectedItems[k].quantity,
        reason: selectedItems[k].reason,
      }));

    if (itemsToClaim.length === 0) {
      setFormError('Please select at least one product to claim.');
      return;
    }

    // Unboxing video validation
    if (uploadedUrls.length === 0) {
      setFormError('An unboxing video is strictly required as proof.');
      return;
    }

    try {
      setIsSubmittingClaim(true);
      await apiClient.createClaim({
        orderId: activeClaimOrder._id,
        products: itemsToClaim,
        proofUrls: uploadedUrls,
        description: claimDescription,
      });
      setActiveClaimOrder(null);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit DOA claim.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-6 md:pt-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-2">Orders</p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">My Orders</h1>
        <p className="text-sm text-slate-500 mt-2">View active order statuses and request Dead on Arrival (DOA) claims under our Live Arrival Guarantee (LAG).</p>
      </div>

      {isConfirmed && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 border border-slate-800 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-amber-400 font-bold text-3xl">
                🎉
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-400 text-slate-950">
                  Payment Verified & Placed
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white mt-1">Order Confirmed!</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium">
                  Thank you! Your payment was verified and your order is being prepared for live express dispatch.
                </p>
              </div>
            </div>
            <Link
              href="/products"
              className="h-10 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-colors shadow-sm shrink-0 flex items-center gap-2 cursor-pointer"
            >
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const orderClaim = claims.find((c) => c.orderId?._id === order._id || c.orderId === order._id);
          const completionTime = order.completedAt ? new Date(order.completedAt) : order.status === 'completed' ? new Date(order.updatedAt) : null;
          
          let eligibilityText = '';
          let canClaim = false;

          if (order.status === 'completed') {
            if (completionTime) {
              const hoursElapsed = (Date.now() - completionTime.getTime()) / (1000 * 60 * 60);
              if (hoursElapsed <= 6) {
                canClaim = !orderClaim;
                const hoursLeft = Math.max(0, 6 - hoursElapsed);
                eligibilityText = `Eligible for DOA Claim (${hoursLeft.toFixed(1)} hours remaining)`;
              } else {
                eligibilityText = 'LAG window expired (6 hours elapsed post-delivery)';
              }
            } else {
              canClaim = !orderClaim;
              eligibilityText = 'Eligible for DOA Claim';
            }
          }

          return (
            <article key={order._id} className="rounded-3xl border border-blue-100 bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-extrabold text-lg text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize
                      ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                        order.status === 'shipped' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        order.status === 'cancelled' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 
                        'bg-blue-50 text-blue-700 border border-blue-100'}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                
                <div className="flex flex-wrap lg:text-right items-center gap-4 lg:gap-6 justify-between lg:justify-end">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Amount</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Shipping/Tracking details */}
              {(order.carrier || order.trackingNumber) && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Tracking Information</p>
                    <p className="text-slate-500 mt-1">
                      {order.carrier && <span>Courier Partner: <strong className="font-semibold text-slate-700">{order.carrier}</strong></span>}
                      {order.trackingNumber && <span className="ml-2">AWB/Tracking ID: <strong className="font-semibold text-slate-700">{order.trackingNumber}</strong></span>}
                    </p>
                  </div>
                  {order.trackingLink && (
                    <a
                      href={order.trackingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-amber-700 hover:text-amber-800 transition-colors uppercase tracking-wider text-[10px] shrink-0"
                    >
                      Track Order <span>→</span>
                    </a>
                  )}
                </div>
              )}

              {/* Products List */}
              <div className="py-6 space-y-4">
                {order.products.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{item.productId?.title || 'Unknown Product'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Quantity: {item.quantity} • ₹{item.price} / {(item.productId as any)?.perPairPrice != null || (item as any)?.perPairPrice != null ? 'pair' : 'piece'}
                        </p>
                      </div>
                    </div>
                    <p className="font-black text-slate-950 text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>

              {/* Claims Section */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {order.status === 'completed' && (
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${canClaim ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold ${canClaim ? 'text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full' : 'text-slate-500'}`}>
                        {eligibilityText}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  {canClaim && (
                    <button
                      onClick={() => openClaimModal(order)}
                      className="inline-flex items-center gap-2 px-5 h-11 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <ShieldAlert className="w-4 h-4 text-blue-400" />
                      File DOA Claim
                    </button>
                  )}

                  {orderClaim && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 w-full sm:max-w-md">
                      <div className="flex items-center gap-2 mb-2">
                        {orderClaim.status === 'approved' ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        ) : orderClaim.status === 'rejected' ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Shield className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-xs font-bold text-slate-900">
                          DOA Claim Status:{' '}
                          <span className={`capitalize font-black ${
                            orderClaim.status === 'approved' ? 'text-emerald-600' :
                            orderClaim.status === 'rejected' ? 'text-rose-600' : 'text-amber-500'
                          }`}>
                            {orderClaim.status}
                          </span>
                        </span>
                      </div>
                      
                      {orderClaim.resolution && (
                        <p className="text-xs text-slate-700 mt-1">
                          <strong className="font-semibold">Resolution:</strong>{' '}
                          <span className="capitalize">{orderClaim.resolution}</span>
                          {orderClaim.resolution === 'refund' && ` (Amount: ₹${orderClaim.refundAmount})`}
                          {orderClaim.resolution === 'replacement' && ` (Replacement Order Scheduled)`}
                        </p>
                      )}

                      {orderClaim.vendorNotes && (
                        <p className="text-xs text-slate-500 italic mt-1.5 border-t border-slate-200/50 pt-1.5">
                          Shop response: "{orderClaim.vendorNotes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {orders.length === 0 && (
          <div className="rounded-3xl border border-blue-100 bg-white p-12 text-center text-slate-500 shadow-sm">
            <Shield className="w-12 h-12 text-blue-200 mx-auto mb-4" />
            <p className="font-bold text-slate-700">No orders found</p>
            <p className="text-sm text-slate-400 mt-1">Once you purchase live varieties, your order list and guarantee claims will show up here.</p>
          </div>
        )}
      </div>

      {/* Claim Filing Modal */}
      {activeClaimOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2rem] border border-blue-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col my-8">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl md:text-2xl font-black text-slate-900">File DOA Claim</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">Order ID: #{activeClaimOrder._id.slice(-6).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setActiveClaimOrder(null)}
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 flex-1">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-3 uppercase tracking-wider">1. Select Claimed Items</h3>
                <div className="space-y-4">
                  {activeClaimOrder.products.map((item) => {
                    const prodId = item.productId?._id;
                    if (!prodId) return null;
                    const isChecked = selectedItems[prodId]?.selected ?? false;
                    const currentQty = selectedItems[prodId]?.quantity ?? 1;
                    const currentReason = selectedItems[prodId]?.reason ?? '';

                    return (
                      <div key={prodId} className={`p-4 rounded-2xl border transition-all ${
                        isChecked ? 'border-blue-200 bg-blue-50/10' : 'border-slate-100'
                      }`}>
                        <div className="flex items-center justify-between gap-4">
                          <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleItemCheckboxChange(prodId, e.target.checked)}
                              className="mt-1 w-4 h-4 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{item.productId.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Ordered Quantity: {item.quantity}</p>
                            </div>
                          </label>
                        </div>

                        {isChecked && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Claim Qty</label>
                              <select
                                value={currentQty}
                                onChange={(e) => handleItemQuantityChange(prodId, Number(e.target.value))}
                                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                {Array.from({ length: item.quantity }, (_, i) => i + 1).map((val) => (
                                  <option key={val} value={val}>
                                    {val}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Reason</label>
                              <input
                                type="text"
                                value={currentReason}
                                onChange={(e) => handleItemReasonChange(prodId, e.target.value)}
                                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Dead on Arrival (DOA)"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-3 uppercase tracking-wider">2. Upload Mandatory Proof (Unboxing Video)</h3>
                <div className="space-y-3">
                  <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'}
                    options={{
                      sources: ['local', 'camera', 'url'],
                      multiple: false,
                      resourceType: 'video',
                    }}
                    onOpen={() => {
                      setFormError('');
                    }}
                    onClose={() => {
                      setIsUploading(false);
                    }}
                    onSuccess={(result: any) => {
                      const info = result?.info;
                      if (info && typeof info === 'object' && 'secure_url' in info) {
                        setUploadedUrls([String(info.secure_url)]);
                        setFormError('');
                      } else {
                        setFormError('Upload succeeded but video URL could not be read. Please try again.');
                      }
                      setIsUploading(false);
                    }}
                    onError={() => {
                      setFormError('Video upload failed. Check file type and size.');
                      setIsUploading(false);
                    }}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUploading(true);
                          open();
                        }}
                        className="w-full py-8 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-blue-50/10 transition-all text-slate-600 font-medium"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <span className="text-sm font-bold text-slate-900">Uploading Video...</span>
                          </>
                        ) : uploadedUrls.length > 0 ? (
                          <>
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700">Unboxing Video Uploaded!</span>
                            <span className="text-xs text-slate-400">Click to change video file</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-8 h-8 text-blue-600" />
                            <span className="text-sm font-bold text-slate-900">Upload Unboxing Video</span>
                            <span className="text-xs text-slate-400">MP4, MOV, or WEBM formats (Mandatory proof)</span>
                          </>
                        )}
                      </button>
                    )}
                  </CldUploadWidget>

                  {uploadedUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold">
                      <FileVideo className="w-4 h-4 shrink-0" />
                      <span className="truncate flex-1">{url}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-3 uppercase tracking-wider">3. Additional Details</h3>
                <textarea
                  value={claimDescription}
                  onChange={(e) => setClaimDescription(e.target.value)}
                  className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Provide any additional details about the shipment box, acclimation process, or water parameters..."
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <button
                onClick={() => setActiveClaimOrder(null)}
                className="px-5 h-12 border border-slate-200 bg-white text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClaimSubmit}
                disabled={isSubmittingClaim}
                className="px-6 h-12 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-800 transition-colors shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isSubmittingClaim ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Submit DOA Claim</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading orders...</p>
        </div>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}
