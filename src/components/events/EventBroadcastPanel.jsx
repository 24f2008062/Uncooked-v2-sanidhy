"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2, Megaphone, Send, AlertCircle, ShieldCheck } from "lucide-react";

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

export default function EventBroadcastPanel({ eventId, enabled, isHost: isHostProp }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canWrite, setCanWrite] = useState(Boolean(isHostProp));
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
        <h2 className="text-sm font-bold text-text-primary">
          {canWrite ? "Broadcast Channel Dispatcher" : "Host Announcements"}
        </h2>
        {canWrite ? (
          <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-auto flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Host Broadcast Control
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 ml-auto flex items-center gap-1">
            <Bell className="w-3 h-3" /> Broadcasts by Host Only
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {canWrite ? (
        <form onSubmit={onSubmit} className="space-y-3 p-4 rounded-2xl bg-background/50 border border-border-subtle">
          <div className="flex items-center justify-between text-[11px] text-text-secondary">
            <span>Post an update to all registered attendees. They will receive an in-app notification.</span>
            <span className="font-mono text-[10px] text-text-muted">{title.length}/200</span>
          </div>
          <input
            type="text"
            required
            maxLength={200}
            placeholder="Announcement title (e.g., Gate Opening at 9:30 AM)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border-subtle text-sm text-text-primary outline-none focus:border-[var(--accent-orange)] transition-colors"
          />
          <textarea
            required
            maxLength={5000}
            rows={4}
            placeholder="Important message or instructions for your registered attendees…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border-subtle text-sm text-text-primary outline-none focus:border-[var(--accent-orange)] resize-y transition-colors"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-text-muted">
              Only hosts & admins can dispatch broadcasts.
            </span>
            <button
              type="submit"
              disabled={sending || !title.trim() || !content.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-md cursor-pointer"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {sending ? "Broadcasting…" : "Broadcast to Attendees"}
            </button>
          </div>
        </form>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="py-6 flex justify-center text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center rounded-2xl bg-background/30 border border-border-subtle">
          <p className="text-xs text-text-secondary">
            {canWrite
              ? "No broadcasts sent yet. Use the dispatcher above to send real-time alerts to your attendees."
              : "No announcements from the host yet. Updates will appear here automatically."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="p-4 rounded-2xl bg-background/40 border border-border-subtle hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                <span className="text-[10px] text-text-secondary whitespace-nowrap font-mono">
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
