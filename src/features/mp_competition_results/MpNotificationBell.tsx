"use client";

import { useState, useEffect, useRef } from "react";
import { getUnreadNotifications, markNotificationAsRead } from "./actions/mpNotificationActions";
import type { MpNotification } from "./types";

export function MpNotificationBell() {
  const [notifications, setNotifications] = useState<MpNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const data = await getUnreadNotifications();
      setNotifications(data);
      setIsLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleNotificationClick(notification: MpNotification) {
    const res = await markNotificationAsRead(notification.id);
    if (!res.error) {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }
  }

  const count = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={count > 0 ? `未読通知 ${count} 件` : "通知"}
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white"
            aria-hidden
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg z-50"
          role="listbox"
        >
          <div className="p-2 border-b border-neutral-100 text-sm font-medium text-neutral-700">
            通知
          </div>
          {isLoading ? (
            <div className="p-4 text-center text-neutral-500 text-sm">読み込み中...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 text-sm">未読はありません</div>
          ) : (
            <ul className="py-1">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className="w-full text-left px-4 py-3 hover:bg-neutral-50 text-sm text-neutral-900 border-b border-neutral-100 last:border-0"
                  >
                    <span className="block">{n.message}</span>
                    <span className="block mt-1 text-xs text-neutral-500">
                      {new Date(n.created_at).toLocaleString("ja-JP")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
