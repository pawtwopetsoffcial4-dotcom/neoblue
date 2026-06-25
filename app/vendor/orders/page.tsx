"use client";

import React, { useEffect, useState } from 'react';
import { Clock3, PackageCheck, Truck, User, MapPin, ShoppingBag, Save, Phone, Mail, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type VendorOrder = {
  _id: string;
  totalAmount: number;
  status: 'placed' | 'accepted' | 'preparing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  products: Array<{
    productId: {
      _id: string;
      title: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  userId?: {
    name: string;
    email: string;
    phone?: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
    phone: string;
  };
  carrier?: string;
  trackingNumber?: string;
  trackingLink?: string;
};

const statuses: VendorOrder['status'][] = ['placed', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled'];

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [trackingDetails, setTrackingDetails] = useState<Record<string, { carrier: string; trackingNumber: string; trackingLink: string }>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = (await apiClient.getOrders()) as { orders: VendorOrder[] };
      const fetchedOrders = response.orders ?? [];
      setOrders(fetchedOrders);

      // Prepopulate tracking inputs state
      const initialTracking: typeof trackingDetails = {};
      fetchedOrders.forEach((order) => {
        initialTracking[order._id] = {
          carrier: order.carrier || '',
          trackingNumber: order.trackingNumber || '',
          trackingLink: order.trackingLink || '',
        };
      });
      setTrackingDetails(initialTracking);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleTrackingChange = (orderId: string, field: 'carrier' | 'trackingNumber' | 'trackingLink', value: string) => {
    setTrackingDetails((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  const updateStatus = async (orderId: string, status: VendorOrder['status']) => {
    try {
      const tracking = trackingDetails[orderId] || { carrier: '', trackingNumber: '', trackingLink: '' };
      await apiClient.updateOrderStatus(
        orderId, 
        status, 
        undefined, 
        status === 'shipped' || status === 'completed' ? tracking.carrier : undefined,
        status === 'shipped' || status === 'completed' ? tracking.trackingNumber : undefined,
        status === 'shipped' || status === 'completed' ? tracking.trackingLink : undefined
      );
      loadOrders();
    } catch {
      alert('Failed to update status. Please try again.');
    }
  };

  const saveTrackingInfoOnly = async (orderId: string) => {
    try {
      setUpdatingOrderId(orderId);
      const tracking = trackingDetails[orderId] || { carrier: '', trackingNumber: '', trackingLink: '' };
      const order = orders.find((o) => o._id === orderId);
      if (!order) return;

      await apiClient.updateOrderStatus(
        orderId,
        order.status,
        undefined,
        tracking.carrier,
        tracking.trackingNumber,
        tracking.trackingLink
      );
      alert('Tracking details updated successfully!');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to save tracking details.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100">Operations</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Vendor Orders</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
          Manage fulfillment checklists, access shipping details, and issue manual tracking updates for your customers.
        </p>
      </section>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Placed</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {orders.filter((order) => order.status === 'placed').length}
              </p>
            </div>
            <Clock3 className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Active</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {orders.filter((order) => ['accepted', 'preparing', 'shipped'].includes(order.status)).length}
              </p>
            </div>
            <PackageCheck className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Completed</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {orders.filter((order) => order.status === 'completed').length}
              </p>
            </div>
            <Truck className="h-10 w-10 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const currentTracking = trackingDetails[order._id] || { carrier: '', trackingNumber: '', trackingLink: '' };
          return (
            <article key={order._id} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              
              {/* Header Info */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-extrabold text-lg text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize
                      ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                        order.status === 'cancelled' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 
                        order.status === 'shipped' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="lg:text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Payout</p>
                    <p className="text-xl font-black text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value as VendorOrder['status'])}
                      className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          Mark as {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Body Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5 border-b border-slate-100">
                
                {/* Left: Products Checklist */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                    Fulfillment Checklist
                  </h3>
                  <div className="space-y-3 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                    {order.products.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id={`check-${order._id}-${idx}`}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer" 
                          />
                          <label htmlFor={`check-${order._id}-${idx}`} className="font-bold text-slate-700 cursor-pointer select-none">
                            {item.productId?.title || 'Unknown Product'}
                          </label>
                        </div>
                        <p className="font-black text-slate-900 shrink-0">
                          Qty: {item.quantity} • ₹{item.price}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Shipping Address & Customer details */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Delivery Details
                  </h3>
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold">{order.userId?.name || 'Customer'}</span>
                    </div>
                    {order.userId?.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{order.userId.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-semibold leading-relaxed">
                        {order.address ? (
                          <>
                            {order.address.street}<br />
                            {order.address.city}, {order.address.state} - {order.address.zipcode}
                          </>
                        ) : (
                          'No address provided'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 font-bold border-t border-slate-200/50 pt-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Phone: {order.address?.phone || order.userId?.phone || 'Unavailable'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom: Manual Shipping Tracking form */}
              {(order.status === 'shipped' || order.status === 'completed') && (
                <div className="pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Manual Shipping Tracking Details
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Required for customer visibility</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Courier Partner</label>
                      <input
                        type="text"
                        value={currentTracking.carrier}
                        onChange={(e) => handleTrackingChange(order._id, 'carrier', e.target.value)}
                        placeholder="e.g. DTDC, Delhivery, Speed Post"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">AWB / Tracking Number</label>
                      <input
                        type="text"
                        value={currentTracking.trackingNumber}
                        onChange={(e) => handleTrackingChange(order._id, 'trackingNumber', e.target.value)}
                        placeholder="e.g. 1234567890"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tracking Link (URL)</label>
                      <input
                        type="url"
                        value={currentTracking.trackingLink}
                        onChange={(e) => handleTrackingChange(order._id, 'trackingLink', e.target.value)}
                        placeholder="e.g. https://track.dtdc.com/..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={updatingOrderId === order._id}
                    onClick={() => saveTrackingInfoOnly(order._id)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-black text-white hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {updatingOrderId === order._id ? 'Saving...' : 'Save Shipment details'}
                  </button>
                </div>
              )}

            </article>
          );
        })}

        {orders.length === 0 && !loadingOrders && (
          <div className="rounded-3xl border border-blue-100 bg-white p-12 text-center text-slate-500 shadow-sm">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">No vendor orders yet</p>
            <p className="text-xs text-slate-400 mt-1">Orders placed by customers will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
