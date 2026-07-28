"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { MapPin, ShoppingBag, Truck, Package, Box, Info } from 'lucide-react';

type AdminOrder = {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  userId?: { name?: string; email?: string };
  vendorId?: { name?: string; email?: string };
  shippingAmount?: number;
  products?: Array<{
    productId?: { title?: string };
    quantity: number;
    price: number;
  }>;
  address?: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
    phone: string;
  };
  notes?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingLink?: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const response = (await apiClient.getAdminOrders()) as { orders: AdminOrder[] };
      setOrders(response.orders ?? []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (status === 'cancelled' && !confirm('Are you sure you want to cancel this order and initiate a refund?')) {
      return;
    }
    
    try {
      setIsUpdating(orderId);
      await apiClient.updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (error: any) {
      alert(`Failed to update order status: ${error.message}`);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Monitoring</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">All Orders</h1>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
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
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs font-medium text-slate-600"><span className="text-slate-400">User:</span> {order.userId?.name ?? order.userId?.email ?? 'N/A'}</p>
                    <p className="text-xs font-medium text-slate-600"><span className="text-slate-400">Vendor:</span> {order.vendorId?.name ?? order.vendorId?.email ?? 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="lg:text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Amount</p>
                    <p className="text-xl font-black text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  
                  {order.status === 'placed' && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => updateOrderStatus(order._id, 'accepted')}
                        disabled={isUpdating === order._id}
                        className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        {isUpdating === order._id ? 'Updating...' : 'Accept Order'}
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        disabled={isUpdating === order._id}
                        className="h-10 px-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-sm font-bold hover:bg-rose-100 transition-colors disabled:opacity-60"
                      >
                        Cancel & Refund
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Body Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5 border-b border-slate-100">
                
                {/* Left: Products Checklist */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                    Products
                  </h3>
                  <div className="space-y-3 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                    {order.products?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-700">
                            {item.productId?.title || 'Unknown Product'}
                          </span>
                        </div>
                        <p className="font-black text-slate-900 shrink-0">
                          Qty: {item.quantity} • ₹{item.price}
                        </p>
                      </div>
                    ))}
                    {order.shippingAmount !== undefined && order.shippingAmount > 0 && (
                      <div className="flex items-center justify-between gap-4 text-xs pt-3 mt-3 border-t border-slate-200">
                        <span className="font-bold text-slate-700">Shipping Charge</span>
                        <p className="font-black text-slate-900">₹{order.shippingAmount}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Delivery Details */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Delivery Details
                  </h3>
                  {order.address ? (
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-sm leading-relaxed text-slate-600">
                      <p className="font-bold text-slate-900 mb-1">{order.userId?.name || 'Customer'}</p>
                      <p>{order.address.street}</p>
                      <p>{order.address.city}, {order.address.state} {order.address.zipcode}</p>
                      <p className="mt-2 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {order.address.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No address provided.</p>
                  )}
                </div>
              </div>

              {/* Footer: Tracking info if shipped */}
              {(order.status === 'shipped' || order.status === 'completed') && (
                <div className="pt-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Carrier: {order.carrier || 'N/A'}</p>
                      <p className="text-xs text-slate-500">Tracking: <span className="font-mono bg-slate-100 px-1 rounded">{order.trackingNumber || 'N/A'}</span></p>
                    </div>
                  </div>
                  {order.trackingLink && (
                    <a href={order.trackingLink} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-50 px-4 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors">
                      Track Package
                    </a>
                  )}
                </div>
              )}
            </article>
        ))}

        {orders.length === 0 && (
          <div className="rounded-2xl bg-white border border-blue-100 p-8 text-center text-slate-600">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}
