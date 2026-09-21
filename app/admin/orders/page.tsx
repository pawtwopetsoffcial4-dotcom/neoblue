"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { 
  MapPin, 
  ShoppingBag, 
  Truck, 
  Package, 
  Box, 
  Info, 
  Calendar, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  Search, 
  TrendingUp,
  AlertCircle,
  XCircle,
  Filter
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'pending' | 'shipped' | 'completed' | 'cancelled'>('all');
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

  // ── Stat Capsules Calculations ──
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayOrdersCount = 0;
    let todayRevenue = 0;
    let totalRevenue = 0;
    let pendingCount = 0;
    let fulfilledCount = 0;
    let cancelledCount = 0;

    orders.forEach((o) => {
      const orderDate = new Date(o.createdAt);
      const isToday = orderDate >= today;
      const isCancelled = o.status === 'cancelled';

      if (isToday && !isCancelled) {
        todayOrdersCount++;
        todayRevenue += o.totalAmount || 0;
      }

      if (!isCancelled) {
        totalRevenue += o.totalAmount || 0;
      }

      if (o.status === 'placed' || o.status === 'pending' || o.status === 'accepted') {
        pendingCount++;
      } else if (o.status === 'shipped' || o.status === 'completed') {
        fulfilledCount++;
      } else if (isCancelled) {
        cancelledCount++;
      }
    });

    const activeTotal = orders.length - cancelledCount;
    const fulfillmentRate = activeTotal > 0 ? Math.round((fulfilledCount / activeTotal) * 100) : 100;

    return {
      todayOrdersCount,
      todayRevenue,
      totalRevenue,
      totalOrdersCount: orders.length,
      pendingCount,
      fulfilledCount,
      fulfillmentRate,
      cancelledCount,
    };
  }, [orders]);

  // ── Filtered Orders ──
  const filteredOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return orders.filter((order) => {
      // Status filter
      if (activeFilter === 'today') {
        if (new Date(order.createdAt) < today) return false;
      } else if (activeFilter === 'pending') {
        if (order.status !== 'placed' && order.status !== 'pending' && order.status !== 'accepted') return false;
      } else if (activeFilter === 'shipped') {
        if (order.status !== 'shipped') return false;
      } else if (activeFilter === 'completed') {
        if (order.status !== 'completed') return false;
      } else if (activeFilter === 'cancelled') {
        if (order.status !== 'cancelled') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const orderId = order._id.toLowerCase();
        const userName = (order.userId?.name || '').toLowerCase();
        const userEmail = (order.userId?.email || '').toLowerCase();
        const phone = (order.address?.phone || '').toLowerCase();
        const city = (order.address?.city || '').toLowerCase();
        const vendorName = (order.vendorId?.name || '').toLowerCase();

        return (
          orderId.includes(query) ||
          userName.includes(query) ||
          userEmail.includes(query) ||
          phone.includes(query) ||
          city.includes(query) ||
          vendorName.includes(query)
        );
      }

      return true;
    });
  }, [orders, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Monitoring &amp; Logistics</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">All Orders</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            Refresh Feed
          </button>
        </div>
      </div>

      {/* ── Stat Capsules Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4">
        {/* Capsule 1: Today's Orders */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'today' ? 'all' : 'today')}
          className={`p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group ${
            activeFilter === 'today'
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-600/20 -translate-y-0.5'
              : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${activeFilter === 'today' ? 'text-blue-100' : 'text-slate-500'}`}>
              Today&apos;s Orders
            </span>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors ${
              activeFilter === 'today' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
            }`}>
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-3xl font-black tracking-tight ${activeFilter === 'today' ? 'text-white' : 'text-slate-900'}`}>
                {stats.todayOrdersCount}
              </span>
              <span className={`text-xs font-bold ${activeFilter === 'today' ? 'text-blue-100' : 'text-slate-400'}`}>
                orders placed
              </span>
            </div>
            <p className={`text-xs font-bold truncate ${activeFilter === 'today' ? 'text-blue-100' : 'text-emerald-600'}`}>
              ₹{stats.todayRevenue.toLocaleString('en-IN')} revenue today
            </p>
          </div>
        </div>

        {/* Capsule 2: Total Revenue */}
        <div 
          onClick={() => setActiveFilter('all')}
          className={`p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group ${
            activeFilter === 'all'
              ? 'bg-white border-emerald-300 shadow-md ring-1 ring-emerald-500/20 hover:-translate-y-0.5'
              : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-3xl font-black tracking-tight text-slate-900">
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 truncate">
              Across {stats.totalOrdersCount} total orders
            </p>
          </div>
        </div>

        {/* Capsule 3: Pending / Needs Dispatch */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending')}
          className={`p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group ${
            activeFilter === 'pending'
              ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-500/20 -translate-y-0.5'
              : 'bg-white border-slate-200/80 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${activeFilter === 'pending' ? 'text-amber-100' : 'text-slate-500'}`}>
              Pending Dispatch
            </span>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors ${
              activeFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
            }`}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-3xl font-black tracking-tight ${activeFilter === 'pending' ? 'text-white' : 'text-slate-900'}`}>
                {stats.pendingCount}
              </span>
              <span className={`text-xs font-bold ${activeFilter === 'pending' ? 'text-amber-100' : 'text-amber-600'}`}>
                awaiting shipment
              </span>
            </div>
            <p className={`text-xs font-bold truncate ${activeFilter === 'pending' ? 'text-amber-100' : 'text-slate-400'}`}>
              {stats.pendingCount > 0 ? 'Action required by vendor' : 'All caught up!'}
            </p>
          </div>
        </div>

        {/* Capsule 4: Fulfilled / Delivered */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'completed' ? 'all' : 'completed')}
          className={`p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group ${
            activeFilter === 'completed'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-600/20 -translate-y-0.5'
              : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${activeFilter === 'completed' ? 'text-indigo-100' : 'text-slate-500'}`}>
              Fulfilled Orders
            </span>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors ${
              activeFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-3xl font-black tracking-tight ${activeFilter === 'completed' ? 'text-white' : 'text-slate-900'}`}>
                {stats.fulfilledCount}
              </span>
              <span className={`text-xs font-bold ${activeFilter === 'completed' ? 'text-indigo-100' : 'text-slate-400'}`}>
                shipped / completed
              </span>
            </div>
            <p className={`text-xs font-bold truncate ${activeFilter === 'completed' ? 'text-indigo-100' : 'text-indigo-600'}`}>
              {stats.fulfillmentRate}% fulfillment rate
            </p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, Phone, City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none -mx-1 px-1">
          {[
            { id: 'all', label: 'All', count: orders.length },
            { id: 'today', label: 'Today', count: stats.todayOrdersCount },
            { id: 'pending', label: 'Pending', count: stats.pendingCount },
            { id: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
            { id: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length },
            { id: 'cancelled', label: 'Cancelled', count: stats.cancelledCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`h-9 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <article key={order._id} className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
              
              {/* Header Info */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <p className="font-black text-base sm:text-lg text-slate-900 font-mono">Order #{order._id.slice(-6).toUpperCase()}</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize
                      ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                        order.status === 'cancelled' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 
                        order.status === 'shipped' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                    <p className="text-xs font-medium text-slate-600"><span className="text-slate-400">User:</span> {order.userId?.name ?? order.userId?.email ?? 'N/A'}</p>
                    <p className="text-xs font-medium text-slate-600"><span className="text-slate-400">Vendor:</span> {order.vendorId?.name ?? order.vendorId?.email ?? 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 sm:gap-4">
                  <div className="lg:text-right">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Amount</p>
                    <p className="text-xl font-black text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  
                  {order.status === 'placed' && (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => updateOrderStatus(order._id, 'accepted')}
                        disabled={isUpdating === order._id}
                        className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        {isUpdating === order._id ? 'Updating...' : 'Accept Order'}
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        disabled={isUpdating === order._id}
                        className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold hover:bg-rose-100 transition-colors disabled:opacity-60"
                      >
                        Cancel & Refund
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Body Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-4 sm:py-5 border-b border-slate-100">
                
                {/* Left: Products Checklist */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                    Products
                  </h3>
                  <div className="space-y-2.5 bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100">
                    {order.products?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Box className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-700 truncate">
                            {item.productId?.title || 'Unknown Product'}
                          </span>
                        </div>
                        <p className="font-black text-slate-900 shrink-0">
                          Qty: {item.quantity} • ₹{item.price}
                        </p>
                      </div>
                    ))}
                    {order.shippingAmount !== undefined && order.shippingAmount > 0 && (
                      <div className="flex items-center justify-between gap-4 text-xs pt-2.5 mt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-700">Shipping Charge</span>
                        <p className="font-black text-slate-900">₹{order.shippingAmount}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Delivery Details */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Delivery Details
                  </h3>
                  {order.address ? (
                    <div className="bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-1">
                      <p className="font-bold text-slate-900 text-sm">{order.userId?.name || 'Customer'}</p>
                      <p>{order.address.street}</p>
                      <p>{order.address.city}, {order.address.state} - {order.address.zipcode}</p>
                      <p className="mt-2 font-bold text-blue-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {order.address.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No address provided.</p>
                  )}
                </div>
              </div>

              {/* Footer: Tracking info if shipped */}
              {(order.status === 'shipped' || order.status === 'completed') && (
                <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">Carrier: {order.carrier || 'N/A'}</p>
                      <p className="text-xs text-slate-500 truncate">Tracking: <span className="font-mono bg-slate-100 px-1 rounded text-slate-800">{order.trackingNumber || 'N/A'}</span></p>
                    </div>
                  </div>
                  {order.trackingLink && (
                    <a href={order.trackingLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-xl bg-blue-50 px-4 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs">
                      Track Package
                    </a>
                  )}
                </div>
              )}
            </article>
        ))}

        {filteredOrders.length === 0 && (
          <div className="rounded-[2rem] bg-white border border-slate-200/80 p-12 text-center text-slate-600 space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-800">No orders match your filter criteria</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? `No results found for "${searchQuery}".` : 'Try selecting a different status filter or clear your search.'}
            </p>
            {(activeFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                className="inline-flex h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
