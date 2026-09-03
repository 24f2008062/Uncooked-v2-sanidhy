"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/SupabaseProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarPlus,
  Loader2,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Ticket,
  Users,
  Clock,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountNav from "@/components/account/AccountNav";
import AgentWidget from "@/components/ui/AgentWidget";

const CATEGORIES = [
  "Tech & Hackathons",
  "Cultural & Music Fests",
  "Workshops & Seminars",
  "Sports & Gaming",
  "Startups & Networking",
  "Clubs & Socials",
];

const FIELD =
  "w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[var(--accent-orange)] transition-colors";
const LABEL = "block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2";

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState("");

  const [form, setForm] = useState(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    startDate.setMinutes(0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 3);
    return {
      title: "",
      category: CATEGORIES[0],
      start: toLocalInputValue(startDate),
      end: toLocalInputValue(endDate),
      location: "",
      description: "",
      ticketType: "Free",
      price: "0",
      capacity: "100",
      unlimitedCapacity: false,
      waitlistEnabled: true,
    };
  });

  useEffect(() => {
    let cancelled = false;
    async function loadRole() {
      if (authStatus === "loading") return;
      if (authStatus !== "authenticated") {
        setLoadingRole(false);
        return;
      }
      try {
        const res = await fetch("/api/user/profile");
        const payload = await res.json();
        if (!cancelled) {
          setRole(payload.data?.user?.role || session?.user?.role || "USER");
        }
      } catch {
        if (!cancelled) setRole(session?.user?.role || "USER");
      } finally {
        if (!cancelled) setLoadingRole(false);
      }
    }
    loadRole();
    return () => {
      cancelled = true;
    };
  }, [authStatus, session?.user?.role]);

  const canPublish = role === "ORGANIZER" || role === "SUPER_ADMIN";

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const startDate = new Date(form.start);
      const endDate = form.end ? new Date(form.end) : null;
      if (!form.title.trim() || !form.location.trim() || Number.isNaN(startDate.getTime())) {
        setError("Title, start time, and location are required.");
        return;
      }
      if (endDate && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
        setError("End time must be after the start time.");
        return;
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          type: form.category,
          date: startDate.toISOString(),
          endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate.toISOString() : null,
          location: form.location.trim(),
          description: form.description.trim() || `${form.title.trim()} (hosted on Uncooked).`,
          ticketType: form.ticketType,
          price: form.ticketType === "Paid" ? form.price : 0,
          capacity: form.capacity,
          unlimitedCapacity: form.unlimitedCapacity,
          waitlistEnabled: form.waitlistEnabled,
        }),
      });
      const payload = await res.json();
      if (res.status === 401) {
        router.push("/login?redirectTo=/create");
        return;
      }
      if (res.status === 403) {
        setError("Only verified organisers can publish. Apply to host first.");
        return;
      }
      if (!res.ok) {
        setError(payload.error?.message || "Could not create event.");
        return;
      }
      const id = payload.data?.event?.id;
      setSuccessId(id || "");
      if (id) router.push(`/events/${encodeURIComponent(id)}`);
    } catch {
      setError("Could not create event. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Navbar forceDarkTop />
      <AgentWidget />
      <main className="min-h-screen bg-primary pt-28 pb-24 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10">
          <AccountNav />

          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-orange)] mb-2">
              Create
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight flex items-center gap-3">
              <CalendarPlus className="w-8 h-8 text-[var(--accent-orange)]" />
              Create your first event
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Same path as campus ops on Uncooked: verified host → publish → signed passes. No fake
              telemetry. Required fields match what the API actually stores.
            </p>
          </div>

          {loadingRole || authStatus === "loading" ? (
            <div className="rounded-3xl bg-card border border-border-subtle p-10 flex items-center justify-center gap-3 text-text-secondary text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking host access…
            </div>
          ) : !canPublish ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-card border border-border-subtle p-6 sm:p-8 space-y-4"
            >
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-orange)] mt-0.5" />
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Verified host required</h2>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    Unlike open social RSVP tools, Uncooked only lets verified organisers publish.
                    Apply once. After admin approval your role becomes ORGANIZER and this form
                    unlocks.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/host/apply" className="btn-primary min-h-[44px] px-6 inline-flex items-center">
                  Apply to host
                </Link>
                <Link href="/events" className="btn-secondary min-h-[44px] px-6 inline-flex items-center">
                  Discover events
                </Link>
              </div>
            </motion.section>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={onSubmit}
              className="grid lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-7 space-y-4">
                <section className="rounded-3xl bg-card border border-border-subtle p-6 sm:p-8 space-y-5">
                  <div>
                    <label className={LABEL} htmlFor="title">
                      Event title
                    </label>
                    <input
                      id="title"
                      className={FIELD}
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="e.g. Campus Design Meetup"
                      maxLength={140}
                      required
                    />
                  </div>

                  <div>
                    <label className={LABEL} htmlFor="category">
                      Category
                    </label>
                    <select
                      id="category"
                      className={FIELD}
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL} htmlFor="start">
                        Start
                      </label>
                      <input
                        id="start"
                        type="datetime-local"
                        className={FIELD}
                        value={form.start}
                        onChange={(e) => update("start", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="end">
                        End
                      </label>
                      <input
                        id="end"
                        type="datetime-local"
                        className={FIELD}
                        value={form.end}
                        onChange={(e) => update("end", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL} htmlFor="location">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="location"
                        className={`${FIELD} pl-10`}
                        value={form.location}
                        onChange={(e) => update("location", e.target.value)}
                        placeholder="Campus hall, building, or virtual link"
                        maxLength={160}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-text-muted mt-2">
                      Offline venue or a virtual meeting link (same idea as Luma location).
                    </p>
                  </div>

                  <div>
                    <label className={LABEL} htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      className={`${FIELD} min-h-[120px] resize-y`}
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      placeholder="What happens, who it is for, what to bring..."
                      maxLength={5000}
                    />
                  </div>
                </section>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <section className="rounded-3xl bg-card border border-border-subtle p-6 sm:p-8 space-y-5 lg:sticky lg:top-24">
                  <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[var(--accent-orange)]" /> Event options
                  </h2>

                  <div>
                    <span className={LABEL}>Ticket price</span>
                    <div className="flex gap-2">
                      {["Free", "Paid"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => update("ticketType", type)}
                          className={`flex-1 min-h-[44px] rounded-xl text-xs font-semibold border transition-colors ${
                            form.ticketType === type
                              ? "bg-[var(--accent-orange)] text-white border-transparent"
                              : "bg-background text-text-secondary border-border-subtle hover:text-text-primary"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {form.ticketType === "Paid" && (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={`${FIELD} mt-3`}
                        value={form.price}
                        onChange={(e) => update("price", e.target.value)}
                        placeholder="Price (INR)"
                      />
                    )}
                    <p className="text-[11px] text-text-muted mt-2">
                      Free RSVPs stay free for students. Card checkout is not enabled in this build.
                    </p>
                  </div>

                  <div>
                    <label className={LABEL} htmlFor="capacity">
                      Capacity
                    </label>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        id="unlimited"
                        type="checkbox"
                        checked={form.unlimitedCapacity}
                        onChange={(e) => update("unlimitedCapacity", e.target.checked)}
                        className="rounded border-border-subtle"
                      />
                      <label htmlFor="unlimited" className="text-xs text-text-secondary">
                        Unlimited (platform max)
                      </label>
                    </div>
                    <div className="relative">
                      <Users className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="capacity"
                        type="number"
                        min="1"
                        max="20000"
                        disabled={form.unlimitedCapacity}
                        className={`${FIELD} pl-10 disabled:opacity-50`}
                        value={form.capacity}
                        onChange={(e) => update("capacity", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="waitlist"
                      type="checkbox"
                      checked={form.waitlistEnabled}
                      onChange={(e) => update("waitlistEnabled", e.target.checked)}
                      className="rounded border-border-subtle"
                    />
                    <label htmlFor="waitlist" className="text-xs text-text-secondary flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Waitlist when full
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successId && (
                    <p className="text-xs text-emerald-400">
                      Published. Opening event page…
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full min-h-[44px] rounded-full font-semibold text-sm text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
                  >
                    {busy ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Creating…
                      </span>
                    ) : (
                      "Create Event"
                    )}
                  </button>

                  <p className="text-[11px] text-text-muted leading-relaxed">
                    After create, attendees register on the event page and receive an HMAC-signed
                    pass on their dashboard. Door scanner is the next product bet, not claimed as
                    live here.
                  </p>
                </section>
              </div>
            </motion.form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
