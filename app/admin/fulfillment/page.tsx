"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { getThumbnailUrl } from '@/lib/media';
import {
  PackageCheck,
  Truck,
  Box,
  CheckCircle2,
  Search,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  RotateCcw,
  Send,
  ShoppingBag,
  RefreshCw,
  X
} from 'lucide-react';

type FulfillmentOrder = {
  _id: string;
  totalAmount: number;
  shippingAmount?: number;
  status: 'pending' | 'placed' | 'accepted' | 'preparing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingLink?: string;
  notes?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  vendorId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
    phone: string;
  };
  products?: Array<{
    productId?: {
      _id?: string;
      title?: string;
      price?: number;
      images?: string[];
    };
    quantity: number;
    price: number;
    unitLabel?: string;
    packQty?: number;
  }>;
};

const COURIER_PRESETS = [
  'Delhivery Express',
  'DTDC Express',
  'Blue Dart',
  'India Post / Speed Post',
  'Xpressbees',
  'Shadowfax',
  'Porter Express',
  'Borzo / WeFast',
  'Neoblue In-House Courier',
];

export default function AdminFulfillmentPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'not_packed' | 'packed' | 'shipped' | 'completed'>('not_packed');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Packed items checklist state: { "orderId-idx": boolean }
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Tracking modal state
  const [trackingModalOrder, setTrackingModalOrder] = useState<FulfillmentOrder | null>(null);
  const [modalCarrier, setModalCarrier] = useState('');
  const [modalTrackingNumber, setModalTrackingNumber] = useState('');
  const [modalTrackingLink, setModalTrackingLink] = useState('');
  const [modalTargetStatus, setModalTargetStatus] = useState<'shipped' | 'completed' | 'keep'>('shipped');
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = (await apiClient.getAdminOrders()) as { orders: FulfillmentOrder[] };
      setOrders(response.orders ?? []);
    } catch (err) {
      console.error('Failed to load fulfillment orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleItemCheck = (orderId: string, idx: number) => {
    const key = `${orderId}-${idx}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Direct status update
  const handleUpdateStatus = async (orderId: string, nextStatus: FulfillmentOrder['status']) => {
    try {
      setIsUpdating(orderId);
      await apiClient.updateOrderStatus(orderId, nextStatus);
      await loadOrders();
    } catch (err: any) {
      alert(`Error updating order status: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(null);
    }
  };

  // Open Tracking Modal
  const openTrackingModal = (order: FulfillmentOrder, defaultStatus: 'shipped' | 'completed' | 'keep' = 'shipped') => {
    setTrackingModalOrder(order);
    setModalCarrier(order.carrier || '');
    setModalTrackingNumber(order.trackingNumber || '');
    setModalTrackingLink(order.trackingLink || '');
    setModalTargetStatus(defaultStatus);
  };

  // Save Tracking Info and Status
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;

    try {
      setIsSavingTracking(true);
      const nextStatus = modalTargetStatus === 'keep' ? trackingModalOrder.status : modalTargetStatus;

      // Auto-generate common tracking links if not provided
      let finalLink = modalTrackingLink.trim();
      const carrierLower = modalCarrier.toLowerCase();
      const awb = modalTrackingNumber.trim();

      if (!finalLink && awb) {
        if (carrierLower.includes('delhivery')) {
          finalLink = `https://www.delhivery.com/track/package/${awb}`;
        } else if (carrierLower.includes('dtdc')) {
          finalLink = `https://track.dtdc.com/ctrk/yourTrack.do?awbNo=${awb}`;
        } else if (carrierLower.includes('blue dart') || carrierLower.includes('bluedart')) {
          finalLink = `https://www.bluedart.com/tracking?numbers=${awb}`;
        } else if (carrierLower.includes('speed post') || carrierLower.includes('india post')) {
          finalLink = `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.application/trackconsignment.aspx`;
        }
      }

      await apiClient.updateOrderStatus(
        trackingModalOrder._id,
        nextStatus,
        undefined,
        modalCarrier.trim() || undefined,
        awb || undefined,
        finalLink || undefined
      );

      setTrackingModalOrder(null);
      await loadOrders();
    } catch (err: any) {
      alert(`Failed to save tracking: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSavingTracking(false);
    }
  };

  // Counts & Statistics
  const stats = useMemo(() => {
    let totalApproved = 0;
    let notPackedCount = 0;
    let packedCount = 0;
    let shippedCount = 0;
    let completedCount = 0;

    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      totalApproved++;
      if (o.status === 'placed' || o.status === 'accepted') {
        notPackedCount++;
      } else if (o.status === 'preparing') {
        packedCount++;
      } else if (o.status === 'shipped') {
        shippedCount++;
      } else if (o.status === 'completed') {
        completedCount++;
      }
    });

    return {
      totalApproved,
      notPackedCount,
      packedCount,
      shippedCount,
      completedCount,
    };
  }, [orders]);

  // Filtered orders for active tab and search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab Filtering
      if (activeTab === 'not_packed') {
        if (order.status !== 'placed' && order.status !== 'accepted') return false;
      } else if (activeTab === 'packed') {
        if (order.status !== 'preparing') return false;
      } else if (activeTab === 'shipped') {
        if (order.status !== 'shipped') return false;
      } else if (activeTab === 'completed') {
        if (order.status !== 'completed') return false;
      } else if (activeTab === 'all') {
        if (order.status === 'cancelled') return false;
      }

      // Search Filtering
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const orderId = order._id.toLowerCase();
        const shortId = order._id.slice(-6).toLowerCase();
        const userName = (order.userId?.name || '').toLowerCase();
        const userEmail = (order.userId?.email || '').toLowerCase();
        const userPhone = (order.address?.phone || order.userId?.phone || '').toLowerCase();
        const city = (order.address?.city || '').toLowerCase();
        const state = (order.address?.state || '').toLowerCase();
        const carrier = (order.carrier || '').toLowerCase();
        const tracking = (order.trackingNumber || '').toLowerCase();
        const productTitles = (order.products || []).map((p) => p.productId?.title?.toLowerCase() || '').join(' ');

        return (
          orderId.includes(query) ||
          shortId.includes(query) ||
          userName.includes(query) ||
          userEmail.includes(query) ||
          userPhone.includes(query) ||
          city.includes(query) ||
          state.includes(query) ||
          carrier.includes(query) ||
          tracking.includes(query) ||
          productTitles.includes(query)
        );
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <PackageCheck className="w-3.5 h-3.5" /> Warehouse &amp; Fulfillment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
            Packing &amp; Dispatch Station
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Process orders through packaging checklists, generate live tracking IDs, and update dispatch stages for buyers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh List'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4">
        {/* Card 1: Not Packed (Urgent) */}
        <div
          onClick={() => setActiveTab('not_packed')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
            activeTab === 'not_packed'
              ? 'bg-amber-500 border-amber-500 text-white shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeTab === 'not_packed' ? 'text-amber-100' : 'text-slate-400'}`}>
              Not Packed
            </span>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${activeTab === 'not_packed' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
              <Box className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black ${activeTab === 'not_packed' ? 'text-white' : 'text-slate-900'}`}>
            {stats.notPackedCount}
          </p>
          <p className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 truncate ${activeTab === 'not_packed' ? 'text-amber-100' : 'text-amber-600'}`}>
            Awaiting Packing
          </p>
        </div>

        {/* Card 2: Packed & Ready */}
        <div
          onClick={() => setActiveTab('packed')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
            activeTab === 'packed'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md ring-2 ring-indigo-600/20'
              : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeTab === 'packed' ? 'text-indigo-100' : 'text-slate-400'}`}>
              Packed &amp; Ready
            </span>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${activeTab === 'packed' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
              <PackageCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black ${activeTab === 'packed' ? 'text-white' : 'text-slate-900'}`}>
            {stats.packedCount}
          </p>
          <p className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 truncate ${activeTab === 'packed' ? 'text-indigo-100' : 'text-indigo-600'}`}>
            Ready for Dispatch
          </p>
        </div>

        {/* Card 3: Shipped / In Transit */}
        <div
          onClick={() => setActiveTab('shipped')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
            activeTab === 'shipped'
              ? 'bg-sky-600 border-sky-600 text-white shadow-md ring-2 ring-sky-600/20'
              : 'bg-white border-slate-200/80 hover:border-sky-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeTab === 'shipped' ? 'text-sky-100' : 'text-slate-400'}`}>
              Shipped
            </span>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${activeTab === 'shipped' ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-600'}`}>
              <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black ${activeTab === 'shipped' ? 'text-white' : 'text-slate-900'}`}>
            {stats.shippedCount}
          </p>
          <p className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 truncate ${activeTab === 'shipped' ? 'text-sky-100' : 'text-sky-600'}`}>
            In Transit / Courier
          </p>
        </div>

        {/* Card 4: Delivered */}
        <div
          onClick={() => setActiveTab('completed')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
            activeTab === 'completed'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeTab === 'completed' ? 'text-emerald-100' : 'text-slate-400'}`}>
              Delivered
            </span>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black ${activeTab === 'completed' ? 'text-white' : 'text-slate-900'}`}>
            {stats.completedCount}
          </p>
          <p className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 truncate ${activeTab === 'completed' ? 'text-emerald-100' : 'text-emerald-600'}`}>
            Completed Orders
          </p>
        </div>

        {/* Card 5: All Active */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden col-span-2 sm:col-span-2 lg:col-span-1 ${
            activeTab === 'all'
              ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/20'
              : 'bg-white border-slate-200/80 hover:border-slate-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeTab === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
              All Active
            </span>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black ${activeTab === 'all' ? 'text-white' : 'text-slate-900'}`}>
            {stats.totalApproved}
          </p>
          <p className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 truncate ${activeTab === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            Approved Pipeline
          </p>
        </div>
      </div>

      {/* ── Search & Tab Bar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, Customer, Phone, City, Tracking ID, Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'not_packed', label: 'Not Packed', count: stats.notPackedCount, dot: 'bg-amber-500' },
            { id: 'packed', label: 'Packed & Ready', count: stats.packedCount, dot: 'bg-indigo-500' },
            { id: 'shipped', label: 'Shipped', count: stats.shippedCount, dot: 'bg-sky-500' },
            { id: 'completed', label: 'Delivered', count: stats.completedCount, dot: 'bg-emerald-500' },
            { id: 'all', label: 'All Approved', count: stats.totalApproved, dot: 'bg-slate-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-9 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Order List ── */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isNotPacked = order.status === 'placed' || order.status === 'accepted';
          const isPacked = order.status === 'preparing';
          const isShipped = order.status === 'shipped';
          const isCompleted = order.status === 'completed';

          // Product items total count
          const totalItemsCount = order.products?.reduce((acc, p) => acc + (p.quantity || 1), 0) || 0;
          const allItemsChecked = (order.products || []).every((_, idx) => checkedItems[`${order._id}-${idx}`]);

          return (
            <article
              key={order._id}
              className={`rounded-2xl sm:rounded-3xl border bg-white p-5 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md ${
                isNotPacked
                  ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/20 to-white'
                  : isPacked
                  ? 'border-indigo-200/80 bg-gradient-to-b from-indigo-50/20 to-white'
                  : isShipped
                  ? 'border-sky-200/80 bg-gradient-to-b from-sky-50/20 to-white'
                  : 'border-slate-200/80'
              }`}
            >
              {/* Order Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-mono">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>

                    {/* Status Pill */}
                    {isNotPacked && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                        <Box className="w-3.5 h-3.5 text-amber-600" />
                        Not Packed
                      </span>
                    )}
                    {isPacked && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Packed &amp; Ready
                      </span>
                    )}
                    {isShipped && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-200">
                        <Truck className="w-3.5 h-3.5 text-sky-600" />
                        Shipped
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Delivered
                      </span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
                        Cancelled
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-medium">
                      • {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span>
                      <strong className="text-slate-700">Buyer:</strong> {order.userId?.name || 'Customer'}
                    </span>
                    {order.vendorId?.name && (
                      <span>
                        • <strong className="text-slate-700">Vendor:</strong> {order.vendorId.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Items Count */}
                <div className="flex items-center gap-4 lg:text-right">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Order</p>
                    <p className="text-xl font-black text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] font-semibold text-slate-400">{totalItemsCount} total items</p>
                  </div>
                </div>
              </div>

              {/* Order Body Grid: Packing Checklist (Left) & Delivery Address (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-4 border-b border-slate-100">
                {/* Left: Interactive Packing Checklist (7 cols) */}
                <div className="lg:col-span-7 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                      Packing Checklist ({order.products?.length || 0} varieties)
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      {allItemsChecked ? '✓ All items packed' : 'Check off items as packed'}
                    </span>
                  </div>

                  <div className="space-y-2 bg-slate-50/70 rounded-2xl p-3 border border-slate-200/60">
                    {order.products?.map((item, idx) => {
                      const itemKey = `${order._id}-${idx}`;
                      const isItemChecked = !!checkedItems[itemKey];
                      const thumb = item.productId?.images?.[0]
                        ? getThumbnailUrl(item.productId.images[0])
                        : null;

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleItemCheck(order._id, idx)}
                          className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isItemChecked
                              ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                              : 'bg-white border-slate-200/60 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isItemChecked}
                              onChange={() => {}} // handled by parent onClick
                              className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                            />

                            {thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Box className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p
                                className={`text-xs font-bold truncate ${
                                  isItemChecked ? 'text-emerald-900 line-through' : 'text-slate-800'
                                }`}
                              >
                                {item.productId?.title || 'Unknown Variety'}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {item.unitLabel ? `Unit: ${item.unitLabel}` : ''}
                                {item.packQty ? ` (${item.packQty} pcs/pack)` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 font-black text-xs">
                              Qty: {item.quantity}
                            </span>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {order.shippingAmount !== undefined && order.shippingAmount > 0 && (
                      <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-500">
                        <span>Shipping &amp; Live Packaging Fee:</span>
                        <span className="font-bold text-slate-800">₹{order.shippingAmount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Shipping Address & Buyer Info (5 cols) */}
                <div className="lg:col-span-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Destination &amp; Contact
                    </h3>
                    {order.address && (
                      <button
                        onClick={() =>
                          handleCopy(
                            `${order.userId?.name || ''}\n${order.address?.street}\n${order.address?.city}, ${
                              order.address?.state
                            } - ${order.address?.zipcode}\nPhone: ${order.address?.phone}`,
                            `addr-${order._id}`
                          )
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        {copiedKey === `addr-${order._id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Copied Address
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Address
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {order.address ? (
                    <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/60 text-xs space-y-2">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{order.userId?.name || 'Customer'}</p>
                        <p className="text-slate-600 font-medium mt-0.5 leading-relaxed">
                          {order.address.street}
                        </p>
                        <p className="text-slate-600 font-bold">
                          {order.address.city}, {order.address.state} - {order.address.zipcode}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/50 flex flex-wrap items-center gap-3">
                        <a
                          href={`tel:${order.address.phone}`}
                          className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.address.phone}</span>
                        </a>

                        {order.userId?.email && (
                          <div className="inline-flex items-center gap-1 text-slate-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{order.userId.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs text-slate-400">
                      No shipping address recorded.
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping / Tracking Details Card (If entered) */}
              {(order.carrier || order.trackingNumber || isShipped || isCompleted) && (
                <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 truncate">
                          {order.carrier || 'Courier Partner Not Specified'}
                        </span>
                        {order.trackingNumber && (
                          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-sky-200 text-sky-900 break-all text-[11px]">
                            AWB: {order.trackingNumber}
                          </span>
                        )}
                      </div>
                      {order.trackingNumber && (
                        <button
                          onClick={() => handleCopy(order.trackingNumber || '', `track-${order._id}`)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 hover:text-sky-800 mt-0.5 cursor-pointer"
                        >
                          {copiedKey === `track-${order._id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied AWB ID
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Tracking ID
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-center flex-wrap sm:flex-nowrap">
                    {order.trackingLink && (
                      <a
                        href={order.trackingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3" /> Track Shipment
                      </a>
                    )}
                    <button
                      onClick={() => openTrackingModal(order, 'keep')}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg bg-white border border-sky-200 text-sky-800 font-bold text-xs hover:bg-sky-50 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Tracking
                    </button>
                  </div>
                </div>
              )}

              {/* Order Action Controls Footer */}
              <div className="mt-4 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Left: Quick Status Switcher */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Stage:
                  </span>
                  <select
                    value={order.status}
                    disabled={isUpdating === order._id}
                    onChange={(e) => handleUpdateStatus(order._id, e.target.value as any)}
                    className="w-full sm:w-auto h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 cursor-pointer transition-all"
                  >
                    <option value="placed">Not Packed (Placed)</option>
                    <option value="accepted">Not Packed (Accepted)</option>
                    <option value="preparing">Packed &amp; Ready (Preparing)</option>
                    <option value="shipped">Shipped (In Transit)</option>
                    <option value="completed">Delivered (Completed)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Right: Stage-Specific Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* If Not Packed */}
                  {isNotPacked && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'preparing')}
                        disabled={isUpdating === order._id}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>{isUpdating === order._id ? 'Updating...' : 'Mark as Packed & Ready'}</span>
                      </button>

                      <button
                        onClick={() => openTrackingModal(order, 'shipped')}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Ship &amp; Add Tracking</span>
                      </button>
                    </>
                  )}

                  {/* If Packed & Ready */}
                  {isPacked && (
                    <>
                      <button
                        onClick={() => openTrackingModal(order, 'shipped')}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black transition-colors shadow-2xs cursor-pointer"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Ship Order (Add Tracking)</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(order._id, 'accepted')}
                        disabled={isUpdating === order._id}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        <span>Revert to Not Packed</span>
                      </button>
                    </>
                  )}

                  {/* If Shipped */}
                  {isShipped && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'completed')}
                        disabled={isUpdating === order._id}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isUpdating === order._id ? 'Updating...' : 'Mark as Delivered'}</span>
                      </button>

                      <button
                        onClick={() => openTrackingModal(order, 'shipped')}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Update Tracking Info</span>
                      </button>
                    </>
                  )}

                  {/* If Delivered */}
                  {isCompleted && (
                    <span className="w-full sm:w-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Order Delivered &amp; Completed
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {filteredOrders.length === 0 && !loading && (
          <div className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 text-center text-slate-600 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <PackageCheck className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-800">No orders found in this fulfillment view</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No orders match "${searchQuery}".`
                : 'All orders in this stage have been processed! Select another tab to review.'}
            </p>
            {(activeTab !== 'not_packed' || searchQuery) && (
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
                className="inline-flex h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                View All Approved Orders
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Tracking & Dispatch Modal ── */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base text-slate-900 truncate">
                    Dispatch &amp; Tracking Information
                  </h3>
                  <p className="text-xs text-slate-500 font-mono truncate">
                    Order #{trackingModalOrder._id.slice(-6).toUpperCase()} • {trackingModalOrder.userId?.name || 'Customer'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTracking} className="p-4 sm:p-5 space-y-4 flex-1">
              {/* Courier Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Courier / Logistics Partner
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COURIER_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setModalCarrier(preset)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        modalCarrier === preset
                          ? 'bg-sky-600 border-sky-600 text-white shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom courier name..."
                  value={modalCarrier}
                  onChange={(e) => setModalCarrier(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-sky-500 transition-all"
                  required
                />
              </div>

              {/* Tracking / AWB Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  AWB / Tracking Number (ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 142093847291 or DTDC789123"
                  value={modalTrackingNumber}
                  onChange={(e) => setModalTrackingNumber(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:border-sky-500 transition-all"
                  required
                />
              </div>

              {/* Tracking Link (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Live Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://track.delhivery.com/..."
                  value={modalTrackingLink}
                  onChange={(e) => setModalTrackingLink(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-sky-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave blank to auto-generate tracking URL for standard carriers (Delhivery, DTDC, Blue Dart).
                </p>
              </div>

              {/* Target Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Set Order Status To:
                </label>
                <select
                  value={modalTargetStatus}
                  onChange={(e) => setModalTargetStatus(e.target.value as any)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-sky-500"
                >
                  <option value="shipped">Mark as Shipped (In Transit)</option>
                  <option value="completed">Mark as Delivered (Completed)</option>
                  <option value="keep">Keep Current Status ({trackingModalOrder.status})</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="w-full sm:w-auto h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTracking}
                  className="w-full sm:w-auto h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-colors shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isSavingTracking ? 'Saving...' : 'Save & Update Customer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
