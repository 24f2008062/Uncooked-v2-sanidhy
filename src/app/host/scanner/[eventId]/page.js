"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, QrCode, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountNav from "@/components/account/AccountNav";

const FIELD =
  "w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[var(--accent-orange)]";

function parsePassPayload(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return {
      registrationId: String(parsed.regId || parsed.registrationId || "").trim(),
      eventId: String(parsed.eventId || "").trim(),
      userId: String(parsed.userId || "").trim(),
      sig: String(parsed.sig || "").trim(),
    };
  } catch {
    return null;
  }
}

export default function HostScannerPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.eventId || "");
  const [eventTitle, setEventTitle] = useState("");
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ checkedIn: 0, total: 0 });

  const preview = useMemo(() => parsePassPayload(raw), [raw]);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`);
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error?.message || "Event not found");
        return;
      }
      setEventTitle(payload.data?.event?.title || eventId);
    } catch {
      setError("Unable to load event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) loadEvent();
  }, [eventId, loadEvent]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    const pass = parsePassPayload(raw);
    if (!pass?.registrationId || !pass?.userId || !pass?.sig) {
      setError("Paste a valid pass JSON from the attendee ticket (regId, eventId, userId, sig).");
      return;
    }
    if (pass.eventId && pass.eventId !== eventId) {
      setError("This pass belongs to a different event.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: pass.registrationId,
          userId: pass.userId,
          sig: pass.sig,
        }),
      });
      const payload = await res.json();
      if (res.status === 401) {
        router.push(`/login?redirectTo=/host/scanner/${encodeURIComponent(eventId)}`);
        return;
      }
      if (!res.ok) {
        setError(payload.error?.message || "Check-in failed");
        return;
      }
      setResult(payload.data);
      if (!payload.data?.alreadyCheckedIn) {
        setStats((s) => ({ ...s, checkedIn: s.checkedIn + 1, total: Math.max(s.total, s.checkedIn + 1) }));
      }
      setRaw("");
    } catch {
      setError("Check-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Navbar forceDarkTop />
      <main className="min-h-screen bg-primary pt-28 pb-24 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 relative z-10">
          <AccountNav />

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>

          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-orange)] mb-2">
              Door scanner
            </p>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <QrCode className="w-8 h-8 text-[var(--accent-orange)]" />
              {loading ? "Loading…" : eventTitle || "Scanner"}
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              Verify HMAC-signed passes at the gate. Camera scanning can be added later; paste or scan-to-text
              the pass JSON for now.
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submit}
            className="rounded-3xl bg-card border border-border-subtle p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Host or admin only. Invalid signatures are rejected.
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                Pass payload
              </label>
              <textarea
                className={`${FIELD} min-h-[120px] font-mono text-xs`}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder='{"regId":"...","eventId":"...","userId":"...","sig":"..."}'
              />
              {preview?.registrationId && (
                <p className="text-[11px] text-text-muted mt-2">
                  Parsed reg {preview.registrationId.slice(0, 8)}… for event {preview.eventId || eventId}
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="flex items-start gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  {result.alreadyCheckedIn ? "Already checked in: " : "Checked in: "}
                  <strong>{result.guestName}</strong>
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[44px] rounded-full font-semibold text-sm text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                </span>
              ) : (
                "Verify and check in"
              )}
            </button>

            <p className="text-[11px] text-text-muted">
              Session checks this browser: {stats.checkedIn} successful check-ins.
            </p>
          </motion.form>
        </div>
      </main>
      <Footer />
    </>
  );
}
