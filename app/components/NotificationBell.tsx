"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, Check, Trash2, ShieldAlert, CircleDot } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNotifications, DbNotification } from '@/lib/hooks/useNotifications';

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    markAllAsRead,
    markAsRead,
    clearAll
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Mark single as read and navigate
  const handleItemClick = async (n: DbNotification) => {
    setIsOpen(false);
    if (!n.read) {
      await markAsRead(n._id);
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative h-9 w-9 rounded-xl text-white flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 transition-all duration-300 ${
          isOpen ? 'ring-2 ring-white/30 bg-white/10' : ''
        }`}
        aria-label="View notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-[-60px] md:right-0 mt-2.5 w-[330px] sm:w-[360px] rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl z-50 text-slate-100 flex flex-col max-h-[480px]">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-white">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {unreadCount} unread • {notifications.length} total
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Push Notification Request Card */}
          {permission === 'default' && (
            <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Allow Push Notifications</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                    Get updates for new orders, DOA claims, and delivery changes in real-time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={requestPermission}
                className="w-full h-8 text-[11px] font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-900/25"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {permission === 'denied' && (
            <div className="mt-2.5 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 text-[10px] text-amber-300">
              <BellOff className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Browser notifications are blocked. Enable them in your browser settings.</span>
            </div>
          )}

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 min-h-[120px] max-h-[300px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Bell className="h-8 w-8 text-slate-600 stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold text-slate-400">You're all caught up!</p>
                <p className="text-[10px] text-slate-500 mt-0.5">No new notifications.</p>
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
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-transparent border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {/* Unread circle dot indicator */}
                    {isUnread && (
                      <CircleDot className="absolute top-3.5 right-3.5 h-2 w-2 text-blue-400" />
                    )}

                    {/* Icon based on notification type */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                      n.type === 'new_order' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      n.type === 'order_status' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      n.type === 'claim' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-white/5 text-slate-300 border border-white/10'
                    }`}>
                      {n.type === 'new_order' ? '💰' :
                       n.type === 'order_status' ? '📦' :
                       n.type === 'claim' ? '⚠️' : '🔔'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate pr-4 ${isUnread ? 'font-extrabold text-white' : 'font-bold text-slate-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1 font-semibold">
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
