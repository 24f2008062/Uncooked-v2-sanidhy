"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/components/providers/SupabaseProvider";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountNav from "@/components/account/AccountNav";
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

const ORG_TYPES = ["College Club", "NGO", "Company", "University", "Independent", "Other"];

const STATUS_COPY = {
  PENDING: {
    icon: Clock,
    color: "text-amber-300",
    title: "Pending review",
    body: "An administrator will review this application. You cannot publish events until it is approved.",
  },
  INFO_REQUESTED: {
    icon: AlertCircle,
    color: "text-orange-300",
    title: "More information requested",
    body: "Update your notes and resubmit. Do not upload identity documents. Aadhaar/PAN uploads are not accepted on this form.",
  },
  APPROVED: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    title: "Verified host",
    body: "You can publish events from the host workspace.",
  },
  REJECTED: {
    icon: XCircle,
    color: "text-red-400",
    title: "Not approved",
    body: "You may update the details and submit again.",
  },
};

export default function HostApplyPage() {
  const { data: session } = useSession();
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState({
    organizationName: "",
    organizationType: "College Club",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/host/apply");
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error?.message || "Unable to load application");
        return;
      }
      const app = payload.data?.application;
      setApplication(app);
      if (app) {
        setForm({
          organizationName: app.organizationName || "",
          organizationType: app.organizationType || "College Club",
          notes: app.notes || "",
        });
      }
    } catch {
      setError("Unable to load application");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const executeLoad = async () => {
      if (isMounted) {
        await load();
      }
    };
    executeLoad();
    return () => {
      isMounted = false;
    };
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/host/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error?.message || "Could not submit application");
        return;
      }
      setMessage(payload.data?.message || "Application submitted");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const status = application?.status;
  const StatusIcon = STATUS_COPY[status]?.icon || ShieldCheck;
  const alreadyApproved = status === "APPROVED";

  return (
    <>
      <Navbar forceDarkTop />
      <main className="min-h-screen bg-primary pt-28 pb-24 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-orange)] mb-2">
            Host verification
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">Apply to host events</h1>
          <p className="text-sm text-text-secondary mb-6">
            Only verified organisers can publish listings. This form is bound to {session?.user?.email}. We do not accept identity-document uploads.
          </p>
          <AccountNav />

          {loading ? (
            <div className="flex items-center justify-center py-16 text-text-secondary gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {status && STATUS_COPY[status] && (
                <div className="p-5 rounded-3xl bg-card border border-border-subtle flex items-start gap-3">
                  <StatusIcon className={`w-5 h-5 mt-0.5 ${STATUS_COPY[status].color}`} />
                  <div>
                    <p className={`text-sm font-bold ${STATUS_COPY[status].color}`}>{STATUS_COPY[status].title}</p>
                    <p className="text-xs text-text-secondary mt-1">{STATUS_COPY[status].body}</p>
                    {application?.rejectionReason && (
                      <p className="text-xs text-red-300 mt-2">Reviewer note: {application.rejectionReason}</p>
                    )}
                    {alreadyApproved && (
                      <Link href="/host" className="inline-block mt-3 text-xs font-bold text-[var(--accent-orange)]">
                        Open event builder →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </p>
              )}
              {message && (
                <p className="text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {message}
                </p>
              )}

              <form onSubmit={submit} className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                    Organisation / club name
                  </label>
                  <input
                    required
                    maxLength={120}
                    disabled={alreadyApproved}
                    value={form.organizationName}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                    className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--accent-orange)] disabled:opacity-60"
                    placeholder="Developer Society UIC"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                    Organisation type
                  </label>
                  <select
                    disabled={alreadyApproved}
                    value={form.organizationType}
                    onChange={(e) => setForm({ ...form, organizationType: e.target.value })}
                    className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--accent-orange)] disabled:opacity-60"
                  >
                    {ORG_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                    Why should this organisation be verified?
                  </label>
                  <textarea
                    required
                    maxLength={2000}
                    disabled={alreadyApproved}
                    rows={5}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--accent-orange)] resize-none disabled:opacity-60"
                    placeholder="Campus club, faculty advisor, typical events you run. Do not paste Aadhaar, PAN, or password data."
                  />
                  <p className="text-[10px] text-text-muted mt-2">{form.notes.length}/2000</p>
                </div>

                {!alreadyApproved && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
                  >
                    {submitting ? "Submitting…" : application ? "Update application" : "Submit application"}
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
