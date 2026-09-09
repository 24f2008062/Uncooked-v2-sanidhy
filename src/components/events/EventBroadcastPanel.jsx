"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2, Megaphone, Send, AlertCircle } from "lucide-react";

function formatWhen(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventBroadcastPanel({ eventId, enabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [allowed, setAllowed] = useState(false);

  const load = useCallback(async () => {
    if (!eventId || !enabled) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/broadcasts?limit=30`, {
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 404) {
        setAllowed(false);
        setItems([]);
        return;
      }
      if (!res.ok || data.success === false) {
        setError(data.error?.message || "Unable to load updates");
        setAllowed(false);
        return;
      }
      setAllowed(true);
      setCanWrite(Boolean(data.data?.canWrite));
      setItems(data.data?.items || []);
    } catch {
      setError("Unable to load updates");
      setAllowed(false);
    } finally {
      setLoading(false);
    }
  }, [eventId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!allowed || !enabled) return undefined;
    const id = setInterval(load, 30_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [allowed, enabled, load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/broadcasts`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, notifyAttendees: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        setError(data.error?.message || "Failed to post update");
        return;
      }
      setTitle("");
      setContent("");
      await load();
    } catch {
      setError("Failed to post update");
    } finally {
      setSending(false);
    }
  };

  if (!enabled) return null;
  if (!loading && !allowed) return null;

  return (
    <section
      id="broadcasts"
      className="p-6 rounded-3xl bg-card border border-border-subtle space-y-4"
    >
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-[var(--accent-orange)]" />
        <h2 className="text-sm font-bold text-text-primary">Event updates</h2>
        <span className="text-[10px] text-text-secondary ml-auto flex items-center gap-1">
          <Bell className="w-3 h-3" /> Host broadcasts only
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {canWrite && (
        <form onSubmit={onSubmit} className="space-y-3 p-4 rounded-2xl bg-background/50 border border-border-subtle">
          <p className="text-[11px] text-text-secondary">
            Post to everyone registered for this event. They will also get an in-app notification.
          </p>
          <input
            type="text"
            required
            maxLength={200}
            placeholder="Update title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-card border border-border-subtle text-sm text-text-primary outline-none focus:border-[var(--accent-orange)]"
          />
          <textarea
            required
            maxLength={5000}
            rows={4}
            placeholder="Message for your attendees…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-card border border-border-subtle text-sm text-text-primary outline-none focus:border-[var(--accent-orange)] resize-y"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !title.trim() || !content.trim()}
              className="px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {sending ? "Sending…" : "Broadcast to attendees"}
            </button>
          </div>
        </form>
      )}

      {loading && items.length === 0 ? (
        <div className="py-6 flex justify-center text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-text-secondary py-2">No updates yet from the host.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="p-4 rounded-2xl bg-background/40 border border-border-subtle"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                <span className="text-[10px] text-text-secondary whitespace-nowrap">
                  {formatWhen(item.createdAt)}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-2 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
