"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatRelative(dateStr) {
  const t = new Date(dateStr).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef(null);

  const fetchInbox = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=20", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) return;
      setItems(data.data?.items || []);
      setUnreadCount(Number(data.data?.unreadCount) || 0);
    } catch {
      /* ignore transient failures */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
    const id = setInterval(fetchInbox, 45_000);
    return () => clearInterval(id);
  }, [fetchInbox]);

  useEffect(() => {
    if (!open) return undefined;
    fetchInbox();
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, fetchInbox]);

  const markRead = async ({ ids, all = false }) => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(all ? { all: true } : { ids }),
      });
      if (!res.ok) return;
      // Refetch to keep unreadCount accurate (avoids double-count bugs on re-click).
      await fetchInbox();
    } catch {
      /* ignore */
    }
  };

  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent-orange)] text-white text-[10px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[min(92vw,360px)] max-h-[70vh] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated,#121216)] shadow-2xl z-[80]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Notifications</p>
              <button
                type="button"
                disabled={unreadCount === 0}
                onClick={() => markRead({ all: true })}
                className="text-[11px] font-medium text-[var(--accent-orange)] disabled:opacity-40 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>

            <div className="overflow-y-auto max-h-[min(60vh,420px)]">
              {loading && items.length === 0 ? (
                <div className="p-6 flex justify-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <p className="p-6 text-xs text-gray-500 text-center">No notifications yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--border-subtle)]">
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!n.readAt) markRead({ ids: [n.id] });
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {!n.readAt && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--accent-orange)] shrink-0" />
                          )}
                          <div className={!n.readAt ? "" : "pl-4"}>
                            <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 whitespace-pre-wrap">
                              {n.body}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1.5">
                              {formatRelative(n.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
