"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, Check, Trash2, ShieldAlert, CircleDot } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

type DbNotification = {
  _id: string;
  title: string;
  message: string;
  type: 'order_status' | 'new_order' | 'claim' | 'general';
  link?: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync browser permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async (isPoll = false) => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const nextNotifications = data.notifications || [];

        // If polling, trigger browser popups for new incoming unread notifications
        if (isPoll && nextNotifications.length > 0) {
          const oldIds = new Set(notifications.map(n => n._id));
          const newUnreads = nextNotifications.filter(
            (n: DbNotification) => !n.read && !oldIds.has(n._id)
          );

          if (newUnreads.length > 0 && Notification.permission === 'granted') {
            newUnreads.forEach((n: DbNotification) => {
              new Notification(n.title, {
                body: n.message,
                icon: '/logo.ico',
              });
            });
          }
        }

        setNotifications(nextNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Initial load and polling setup
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications(true);
      }, 15000); // Poll every 15 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request browser push notification permission
  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      if (status === 'granted') {
        new Notification('Notifications Enabled!', {
          body: 'You will now receive real-time updates for order status, claims, and sales.',
          icon: '/logo.ico',
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  // Mark single as read and navigate
  const handleItemClick = async (n: DbNotification) => {
    setIsOpen(false);
    if (!n.read) {
      try {
        const res = await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: n._id }),
        });
        if (res.ok) {
          setNotifications(prev =>
            prev.map(item => (item._id === n._id ? { ...item, read: true } : item))
          );
        }
      } catch (error) {
        console.error('Error marking notification read:', error);
      }
    }

    if (n.link) {
      router.push(n.link);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-xl text-white flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 transition-all duration-300"
        aria-label="View notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-blue-600">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-[-60px] md:right-0 mt-2.5 w-[330px] sm:w-[360px] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl z-50 text-slate-800 flex flex-col max-h-[480px]">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {unreadCount} unread • {notifications.length} total
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Push Notification Request Card */}
          {permission === 'default' && (
            <div className="mt-3 bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Allow Push Notifications</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                    Get updates for new orders, DOA claims, and delivery changes in real-time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={requestPermission}
                className="w-full h-8 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {permission === 'denied' && (
            <div className="mt-2.5 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-[10px] text-amber-800">
              <BellOff className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Browser notifications are blocked. Enable them in your browser settings.</span>
            </div>
          )}

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 min-h-[120px] max-h-[300px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell className="h-8 w-8 text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold">You're all caught up!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">No new notifications.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read;
                return (
                  <div
                    key={n._id}
                    onClick={() => handleItemClick(n)}
                    className={`group relative flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                      isUnread
                        ? 'bg-slate-50 border-blue-100/70 hover:bg-slate-100/80'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {/* Unread circle dot indicator */}
                    {isUnread && (
                      <CircleDot className="absolute top-3 right-3 h-2 w-2 text-blue-600" />
                    )}

                    {/* Icon based on notification type */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                      n.type === 'new_order' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      n.type === 'order_status' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      n.type === 'claim' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {n.type === 'new_order' ? '💰' :
                       n.type === 'order_status' ? '📦' :
                       n.type === 'claim' ? '⚠️' : '🔔'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate pr-3 ${isUnread ? 'font-extrabold text-slate-900' : 'font-bold text-slate-600'}`}>
                        {n.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                        {new Date(n.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
}
