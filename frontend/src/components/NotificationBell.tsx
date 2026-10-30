'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  CheckCheck, 
  Trophy, 
  Sparkles, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { fetchApi, clearApiCache } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACHIEVEMENT';
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchApi('/notifications', { skipCache: true })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch notifications:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Listen to real-time notifications via WebSocket
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    const handleNewNotification = (data: { notification: NotificationItem }) => {
      if (!data?.notification) return;

      const newNotif = data.notification;
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      clearApiCache('/notifications');

      // Trigger modern toast banner
      if (newNotif.type === 'ACHIEVEMENT') {
        toast.success(`🏆 ${newNotif.title}: ${newNotif.message}`);
      } else {
        toast.info(`🔔 ${newNotif.title}: ${newNotif.message}`);
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [user?.id, toast]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single as read
  const handleMarkRead = async (id: string, link?: string | null) => {
    try {
      const res = await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        clearApiCache('/notifications');
      }
    } catch (err) {
      console.warn('Failed marking notification read:', err);
    }

    if (link) {
      setIsOpen(false);
      router.push(link);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      const res = await fetchApi('/notifications/read-all', { method: 'PATCH' });
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        clearApiCache('/notifications');
        toast.success('All notifications marked as read.');
      } else {
        toast.error(res.message || 'Could not mark all as read.');
      }
    } catch (err) {
      toast.error('Could not mark all as read.');
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View notifications"
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
            : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        <Bell className="w-5 h-5 transition-transform group-hover:scale-105" />

        {/* Pulse unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-rose-500/50 ring-2 ring-slate-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5 custom-scrollbar">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <div className="inline-block w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <Sparkles className="w-8 h-8 text-amber-400/60 mx-auto mb-2 opacity-80" />
                <p className="font-medium text-gray-200">All caught up!</p>
                <p className="text-xs text-gray-500 mt-1">
                  You have no unread alerts or achievements at this moment.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon =
                  notif.type === 'ACHIEVEMENT'
                    ? Trophy
                    : notif.type === 'SUCCESS'
                    ? CheckCircle2
                    : notif.type === 'WARNING'
                    ? AlertCircle
                    : Info;

                const iconColor =
                  notif.type === 'ACHIEVEMENT'
                    ? 'text-amber-400 bg-amber-500/20 border-amber-500/30'
                    : notif.type === 'SUCCESS'
                    ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                    : notif.type === 'WARNING'
                    ? 'text-orange-400 bg-orange-500/20 border-orange-500/30'
                    : 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkRead(notif.id, notif.link)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer group ${
                      notif.isRead
                        ? 'bg-transparent hover:bg-white/5 opacity-80 hover:opacity-100'
                        : 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-amber-400'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            notif.isRead ? 'text-gray-300' : 'text-gray-100'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-500">
                        <span>{new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {notif.link && (
                          <span className="flex items-center gap-0.5 text-amber-400 group-hover:underline">
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
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
