"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, markNotificationsRead } from "@/hooks/useNotifications";
import clsx from "clsx";

export function NotificationBell() {
  const { data, mutate } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = data?.data ?? [];
  const unreadCount = data?.unread_count ?? 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      await markNotificationsRead();
      mutate();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="region"
            aria-label="Notifications"
            className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-xl bg-background-card border border-surface-border shadow-xl shadow-black/30 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-surface-border">
              <h3 className="text-sm font-semibold text-white">
                Notifications
              </h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={clsx(
                      "px-4 py-3 border-b border-surface-border/50 last:border-0",
                      !n.read && "bg-accent-purple/5",
                    )}
                  >
                    <p className="text-sm text-white">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
