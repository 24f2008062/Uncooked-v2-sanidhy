"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserX,
} from "lucide-react";

export default function EventSubHostsPanel({
  eventId,
  isCreator = false,
  isSubHost = false,
  initialSubHosts = [],
  onUpdated,
}) {
  const [subHosts, setSubHosts] = useState(initialSubHosts);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SUB_HOST");
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setSubHosts(initialSubHosts);
  }, [initialSubHosts]);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/subhosts`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data?.subHosts)) {
        setSubHosts(data.data.subHosts);
        onUpdated?.(data.data.subHosts);
      }
    } catch {
      /* ignore background refresh error */
    }
  }, [eventId, onUpdated]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid user email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/subhosts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, role }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to assign sub-host.");
        setLoading(false);
        return;
      }

      setSuccess(`Assigned ${data.data?.subHost?.name || cleanEmail} as ${role === "CHECKIN_STAFF" ? "Check-in Staff" : "Co-Host"}.`);
      setEmail("");
      await refreshList();
    } catch {
      setError("Unable to assign sub-host right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId, userName) => {
    if (!confirm(`Are you sure you want to remove ${userName || "this staff member"} from this event?`)) {
      return;
    }

    setError("");
    setSuccess("");
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/subhosts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to remove sub-host.");
        setRemovingId(null);
        return;
      }

      setSuccess(`Removed staff member successfully.`);
      await refreshList();
    } catch {
      setError("Unable to remove sub-host right now. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="p-6 rounded-3xl bg-card border border-border-subtle space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--accent-orange)]" />
          <h2 className="text-sm font-bold text-text-primary">Co-Hosts & Check-in Staff</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90">
            {subHosts.length} Assigned
          </span>
        </div>
        {isSubHost && !isCreator && (
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Staff Member
          </span>
        )}
      </div>

      <p className="text-xs text-text-secondary leading-relaxed">
        Assigned co-hosts and check-in staff can access the attendee roster, operate the live QR pass scanner at the door, and send broadcast updates.
      </p>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Add Sub-Host Form for Creator */}
      {isCreator && (
        <form onSubmit={handleAdd} className="space-y-2.5 pt-1">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                required
                placeholder="Enter user email (e.g. colleague@university.edu)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border-subtle text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-[var(--accent-orange)] transition-colors"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-background/80 border border-border-subtle text-xs text-text-primary outline-none focus:border-[var(--accent-orange)] transition-colors"
            >
              <option value="SUB_HOST">Co-Host (Full Access)</option>
              <option value="CHECKIN_STAFF">Check-in Staff</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 transition-all active:scale-98 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>Assign Staff</span>
            </button>
          </div>
        </form>
      )}

      {/* Sub-Hosts List */}
      {subHosts.length === 0 ? (
        <div className="py-6 text-center rounded-2xl bg-background/30 border border-border-subtle text-xs text-text-muted">
          No co-hosts or check-in staff assigned yet.
        </div>
      ) : (
        <div className="divide-y divide-border-subtle rounded-2xl border border-border-subtle overflow-hidden bg-background/30">
          {subHosts.map((sh) => (
            <div
              key={sh.id || sh.userId}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-text-primary truncate">{sh.name}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${
                      sh.role === "CHECKIN_STAFF"
                        ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                        : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                    }`}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    {sh.role === "CHECKIN_STAFF" ? "Door Staff" : "Co-Host"}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted truncate mt-0.5 font-mono">{sh.email}</p>
              </div>

              {isCreator && (
                <button
                  type="button"
                  disabled={removingId === sh.userId}
                  onClick={() => handleRemove(sh.userId, sh.name)}
                  className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Remove from event staff"
                >
                  {removingId === sh.userId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

