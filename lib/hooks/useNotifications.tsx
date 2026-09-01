'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api-client';

export type DbNotification = {
  _id: string;
  title: string;
  message: string;
  type: 'order_status' | 'new_order' | 'claim' | 'general';
  link?: string;
  read: boolean;
  createdAt: string;
};

interface NotificationContextType {
  notifications: DbNotification[];
  unreadCount: number;
  isLoading: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  fetchNotifications: (isPoll?: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const knownNotificationIdsRef = useRef<string[]>([]);
  const initialFetchDone = useRef(false);

  // Sync browser permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch notifications helper
  const fetchNotifications = async (isPoll = false) => {
    if (!user) return;
    if (!isPoll && !initialFetchDone.current) {
      setIsLoading(true);
    }

    try {
      const data = await apiClient.request<{ notifications: any[] }>('/notifications', { cache: 'no-store' });
      const nextNotifications = data.notifications || [];

        // If polling, trigger browser popups for new incoming unread notifications
        if (isPoll && nextNotifications.length > 0) {
          const oldIds = new Set(notifications.map(n => n._id));
          const newUnreads = nextNotifications.filter(
            (n: DbNotification) => !n.read && !oldIds.has(n._id)
          );

          if (newUnreads.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            newUnreads.forEach((n: DbNotification) => {
              new Notification(n.title, {
                body: n.message,
                icon: '/logo.ico',
              });
            });
          }
        } else if (!isPoll) {
          // If first load, initialize known ids for future poll popups
          knownNotificationIdsRef.current = nextNotifications.map((n: any) => n._id);
          initialFetchDone.current = true;
        }

        setNotifications(nextNotifications);
    } catch (error) {
      console.warn('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      await apiClient.request('/notifications', {
        method: 'PUT',
        body: JSON.stringify({ all: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  // Mark single as read
  const markAsRead = async (id: string) => {
    const target = notifications.find(n => n._id === id);
    if (!target || target.read) return;

    try {
      await apiClient.request('/notifications', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      });
      setNotifications(prev =>
        prev.map(item => (item._id === id ? { ...item, read: true } : item))
      );
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      await apiClient.request('/notifications', {
        method: 'DELETE',
      });
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Set up polling loop (optimized to prevent edge request exhaustion)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      initialFetchDone.current = false;
      return;
    }

    fetchNotifications(false);

    const interval = setInterval(() => {
      // Skip background polling if tab is hidden
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchNotifications(true);
    }, 180000); // Poll every 3 minutes instead of rapid polling

    // Refetch immediately when user focuses back on the tab
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchNotifications(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        permission,
        requestPermission,
        markAllAsRead,
        markAsRead,
        clearAll,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
