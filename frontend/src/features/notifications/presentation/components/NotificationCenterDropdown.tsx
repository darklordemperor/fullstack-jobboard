"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AppNotification } from "@/features/notifications/domain/entities/Notification";
import { useNotificationsStore } from "@/features/notifications/presentation/store/notificationsStore";

export function NotificationCenterDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    items,
    unreadCount,
    status,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        id="notification-bell-btn"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex items-center justify-center rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <svg
          className="size-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            data-testid="unread-notification-badge"
            className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 ring-2 ring-slate-950"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notification center"
          className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
            {status === "loading" && items.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Loading notifications…
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No notifications yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/60" role="list">
                {items.map((notification) => {
                  const isUnread = !notification.readAt;
                  return (
                    <li
                      key={notification.id}
                      className={`relative flex flex-col gap-1 p-3.5 transition hover:bg-slate-800/50 ${
                        isUnread ? "bg-slate-800/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <span
                              className="size-2 rounded-full bg-emerald-400 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={`text-xs font-semibold ${
                              isUnread ? "text-emerald-300" : "text-slate-300"
                            }`}
                          >
                            {notification.title}
                          </span>
                        </div>
                        <time
                          dateTime={notification.createdAt}
                          className="shrink-0 text-[10px] text-slate-400"
                        >
                          {new Date(notification.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </time>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="mt-1 flex items-center justify-between text-xs">
                        {notification.url ? (
                          <Link
                            href={notification.url}
                            onClick={() => handleNotificationClick(notification)}
                            className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            View details →
                          </Link>
                        ) : (
                          <span />
                        )}

                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="text-[11px] text-slate-400 hover:text-slate-200"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
