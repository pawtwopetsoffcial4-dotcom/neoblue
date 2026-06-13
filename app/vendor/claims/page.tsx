"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Shield, ShieldAlert, ShieldCheck, FileVideo, Eye, Check, X, Loader2, AlertCircle, ShoppingBag, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type ClaimProduct = {
  productId: {
    _id: string;
    title: string;
    price: number;
  };
  quantity: number;
  reason: string;
  _id: string;
};

type Claim = {
  _id: string;
  orderId: {
    _id: string;
    status: string;
    totalAmount: number;
    completedAt?: string;
    createdAt: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  vendorId: {
    _id: string;
    name: string;
    email: string;
  };
  products: ClaimProduct[];
  proofUrls: string[];
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  resolution?: 'refund' | 'replacement';
  refundAmount?: number;
  replacementOrderId?: string;
  vendorNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export default function VendorClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Claim Detail & Processing State
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);
  const [resolution, setResolution] = useState<'refund' | 'replacement'>('refund');
  const [refundAmount, setRefundAmount] = useState('0');
  const [vendorNotes, setVendorNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadClaims = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.getClaims();
      setClaims((res as { claims: Claim[] }).claims ?? []);
    } catch (err) {
      console.error(err);
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const openClaimDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setActionType(null);
    setResolution('refund');
    
    // Auto-calculate maximum refund amount based on claimed items' original price
    const maxRefund = claim.products.reduce((sum, p) => {
      const price = p.productId?.price || 0;
      return sum + price * p.quantity;
    }, 0);
    
    setRefundAmount(maxRefund.toString());
    setVendorNotes('');
    setErrorMsg('');
  };

  const handleProcessClaimSubmit = async () => {
    if (!selectedClaim || !actionType) return;
    setErrorMsg('');

    const payload: any = {
      status: actionType,
      vendorNotes,
    };

    if (actionType === 'approved') {
      payload.resolution = resolution;
      if (resolution === 'refund') {
        const amt = Number(refundAmount);
        if (isNaN(amt) || amt < 0) {
          setErrorMsg('Please enter a valid refund amount.');
          return;
        }
        payload.refundAmount = amt;
      }
    }

    try {
      setIsProcessing(true);
      await apiClient.processClaim(selectedClaim._id, payload);
      setSelectedClaim(null);
      loadClaims();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update claim.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-semibold animate-pulse">Loading claims...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)] sm:p-8">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-200" />
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100">Live Arrival Guarantee</p>
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">DOA Claims Portal</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
          Review buyer DOA claim submissions, inspect unboxing video proofs, and process refunds or replacement shipments within the 6-hour window.
        </p>
      </section>

      {/* Stats overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600">Pending claims</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{claims.filter((c) => c.status === 'pending').length}</p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Approved claims</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{claims.filter((c) => c.status === 'approved').length}</p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-600">Rejected claims</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{claims.filter((c) => c.status === 'rejected').length}</p>
        </div>
      </div>

      {/* Filter tab buttons */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              statusFilter === status
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-blue-100 text-slate-600 hover:bg-blue-50/50'
            }`}
          >
            {status} ({status === 'all' ? claims.length : claims.filter((c) => c.status === status).length})
          </button>
        ))}
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {filteredClaims.map((claim) => (
          <article key={claim._id} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-slate-900">Claim for Order #{claim.orderId?._id?.slice(-6).toUpperCase() || 'UNKNOWN'}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize border
                    ${claim.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      claim.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                      'bg-amber-50 text-amber-700 border-amber-100'}`}
                  >
                    {claim.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Buyer: <span className="font-semibold text-slate-800">{claim.userId?.name}</span> ({claim.userId?.email})
                </p>
                <p className="text-xs text-slate-400">Submitted on {new Date(claim.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => openClaimDetails(claim)}
                  className="h-10 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Review Claim
                </button>
              </div>
            </div>
          </article>
        ))}

        {filteredClaims.length === 0 && (
          <div className="rounded-3xl border border-blue-100 bg-white p-12 text-center text-slate-500 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-blue-200 mx-auto mb-4" />
            <p className="font-bold text-slate-700">No DOA claims here</p>
            <p className="text-sm text-slate-400 mt-1">Claims matching this status category will show up here.</p>
          </div>
        )}
      </div>

      {/* Claim Detail & Processing Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.2rem] border border-blue-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col my-8">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl md:text-2xl font-black text-slate-900">Review DOA Claim</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">Claim ID: #{selectedClaim._id.toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 flex-1">
              {/* Buyer info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Buyer Information</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedClaim.userId?.name}</p>
                  <p className="text-xs text-slate-500">{selectedClaim.userId?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Order Reference</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">Order #{selectedClaim.orderId?._id?.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-slate-500">Total Amount: ₹{selectedClaim.orderId?.totalAmount}</p>
                </div>
              </div>

              {/* Claimed Items */}
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-3 uppercase tracking-wider">Claimed Products</h3>
                <div className="space-y-3">
                  {selectedClaim.products.map((p) => (
                    <div key={p._id} className="flex items-start justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{p.productId?.title || 'Unknown Product'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Quantity Claimed: <span className="font-bold text-slate-800">{p.quantity}</span></p>
                        <p className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md mt-1.5 w-fit font-semibold">Reason: {p.reason}</p>
                      </div>
                      <p className="text-xs font-black text-slate-950">₹{((p.productId?.price || 0) * p.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {selectedClaim.description && (
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 mb-2 uppercase tracking-wider">Buyer Notes</h3>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                    "{selectedClaim.description}"
                  </p>
                </div>
              )}

              {/* Proof Video player */}
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <FileVideo className="w-4 h-4 text-blue-600" /> Proof Video (Unboxing video)
                </h3>
                <div className="space-y-3">
                  {selectedClaim.proofUrls.map((url, i) => (
                    <div key={i} className="rounded-3xl border border-slate-200 overflow-hidden bg-slate-950 aspect-video shadow-inner relative group">
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution History if not Pending */}
              {selectedClaim.status !== 'pending' && (
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Claim History</p>
                  <p className="text-sm font-bold text-slate-900">
                    Resolution Status:{' '}
                    <span className={`capitalize font-black ${
                      selectedClaim.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {selectedClaim.status}
                    </span>
                  </p>
                  {selectedClaim.resolution && (
                    <p className="text-xs text-slate-700">
                      Resolution Action:{' '}
                      <span className="capitalize font-bold text-slate-800">{selectedClaim.resolution}</span>
                      {selectedClaim.resolution === 'refund' && ` (Refund amount: ₹${selectedClaim.refundAmount})`}
                      {selectedClaim.resolution === 'replacement' && ` (Replacement order: #${selectedClaim.replacementOrderId?.slice(-6).toUpperCase()})`}
                    </p>
                  )}
                  {selectedClaim.vendorNotes && (
                    <p className="text-xs text-slate-500 italic mt-2 border-t border-slate-200/50 pt-2">
                      Shop response notes: "{selectedClaim.vendorNotes}"
                    </p>
                  )}
                </div>
              )}

              {/* Action Form if Pending */}
              {selectedClaim.status === 'pending' && (
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">DOA Claim Verdict</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('approved');
                        setErrorMsg('');
                      }}
                      className={`h-11 rounded-2xl font-bold text-xs uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        actionType === 'approved'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="w-4 h-4" /> Approve Claim
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('rejected');
                        setErrorMsg('');
                      }}
                      className={`h-11 rounded-2xl font-bold text-xs uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        actionType === 'rejected'
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <X className="w-4 h-4" /> Reject Claim
                    </button>
                  </div>

                  {actionType === 'approved' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Resolution Action</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="resolution"
                              checked={resolution === 'refund'}
                              onChange={() => setResolution('refund')}
                              className="w-4 h-4 text-blue-600"
                            />
                            Approve Refund
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="resolution"
                              checked={resolution === 'replacement'}
                              onChange={() => setResolution('replacement')}
                              className="w-4 h-4 text-blue-600"
                            />
                            Schedule Replacement Shipment
                          </label>
                        </div>
                      </div>

                      {resolution === 'refund' && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Refund Amount (₹)</label>
                          <input
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter amount to refund"
                          />
                        </div>
                      )}

                      {resolution === 'replacement' && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>
                            Resolving via **Replacement** will programmatically generate a new shipment order at **₹0 cost** containing the claimed live specimens.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Shop Response Notes</label>
                    <textarea
                      value={vendorNotes}
                      onChange={(e) => setVendorNotes(e.target.value)}
                      className="w-full min-h-[80px] rounded-2xl border border-slate-200 bg-white p-3.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Add explanation notes for approval or rejection reasons..."
                    />
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>{errorMsg}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <button
                onClick={() => setSelectedClaim(null)}
                className="px-5 h-12 border border-slate-200 bg-white text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              {selectedClaim.status === 'pending' && actionType && (
                <button
                  onClick={handleProcessClaimSubmit}
                  disabled={isProcessing}
                  className="px-6 h-12 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-800 transition-colors shadow-sm disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>Submit Claim Verdict</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
