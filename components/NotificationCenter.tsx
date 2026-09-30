'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import {
  NotificationItem,
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/app/actions/notifications';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load notifications on mount
  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        setIsLoading(true);
        const res = await getNotificationsAction();
        if (isMounted) {
          setNotifications(res?.notifications ?? []);
          setUnreadCount(res?.unreadCount ?? 0);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadNotifications();

    // Refresh every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.key === item.key ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationReadAction(item.key);
    }
    setIsOpen(false);
    router.push(item.href);
  };

  const handleMarkAllRead = async () => {
    const unreadKeys = notifications.filter((n) => !n.isRead).map((n) => n.key);
    if (unreadKeys.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsReadAction(unreadKeys);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md border border-[#e0e2e6] bg-[#ffffff] text-[#41454d] shadow-2xs transition-colors hover:bg-[#f8fafc] hover:text-[#181d26]"
        title="Notification Center"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#aa2d00] px-1 text-[9px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#f0f2f5] bg-[#fafbfc] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#181d26]">Attention Items</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#aa2d00] px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-[#aa2d00] hover:text-[#882400]"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#f0f2f5]">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-xs text-[#9297a0]">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9297a0]">
                <p className="font-semibold text-[#181d26]">All caught up!</p>
                <p className="mt-0.5">No pending attention signals right now.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.key}
                  onClick={() => handleItemClick(item)}
                  className={`group flex items-start gap-3 p-3 text-xs cursor-pointer transition-colors ${
                    !item.isRead ? 'bg-[#f0f4ff]/50 hover:bg-[#e6edff]' : 'hover:bg-[#f8fafc]'
                  }`}
                >
                  {/* Unread indicator dot */}
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      !item.isRead ? 'bg-[#aa2d00]' : 'bg-transparent'
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs truncate ${!item.isRead ? 'font-bold text-[#181d26]' : 'font-medium text-[#41454d]'}`}>
                        {item.title}
                      </span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.2 text-[9px] font-semibold border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#5f6570] line-clamp-1">{item.subtitle}</p>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#9297a0] opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#f0f2f5] bg-[#fafbfc] px-4 py-2 text-center">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-[#181d26] hover:underline"
            >
              Go to Home Dashboard →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
