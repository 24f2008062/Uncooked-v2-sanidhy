"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SupabaseProvider";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AgentWidget from "@/components/ui/AgentWidget";
import TicketPassCard from "@/components/events/TicketPassCard";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop";

function formatWhen(dateValue) {
  if (!dateValue) return { date: "", time: "" };
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const id = typeof params?.id === "string" ? params.id : "";

  const [event, setEvent] = useState(null);
  const [myRegistration, setMyRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(id)}`);
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error?.message || "Event not found");
        setEvent(null);
        return;
      }
      setEvent(payload.data.event);
      setMyRegistration(payload.data.myRegistration);
    } catch {
      setError("Unable to load this event");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      if (isMounted) {
        await load();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [id, authStatus, load]);

  const register = async () => {
    if (authStatus !== "authenticated") {
      router.push(`/login?redirectTo=/events/${encodeURIComponent(id)}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id }),
      });
      const payload = await res.json();
      if (res.status === 401) {
        router.push(`/login?redirectTo=/events/${encodeURIComponent(id)}`);
        return;
      }
      if (!res.ok) {
        setError(payload.error?.message || "Could not complete registration");
        return;
      }
      setMyRegistration({
        id: payload.data.registrationId,
        status: payload.data.status,
        ticketPass: payload.data.ticketPass,
      });
    } finally {
      setBusy(false);
    }
  };

  const when = formatWhen(event?.date);
  const isFree = event?.ticketType !== "Paid";
  const isFull = event && event.spotsLeft <= 0;

  return (
    <>
      <Navbar forceDarkTop />
      <AgentWidget />
      <main className="min-h-screen bg-primary pt-28 pb-24 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to events
          </Link>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-text-secondary gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading event
            </div>
          ) : !event ? (
            <div className="p-10 rounded-3xl bg-card border border-border-subtle text-center max-w-md mx-auto my-12 shadow-xl">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-text-primary mb-2">Event Unavailable</h1>
              <p className="text-sm text-text-secondary mb-6">{error || "This event listing could not be found or is no longer public."}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={load}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-background text-text-primary border border-border-subtle hover:bg-border-subtle transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/events"
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white"
                  style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
                >
                  Explore Events
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-7 space-y-6"
              >
                <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden border border-border-subtle bg-zinc-900">
                  <Image
                    src={event.bannerUrl || FALLBACK_BANNER}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-[var(--accent-orange)] border border-white/10">
                      {event.category || event.type}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full backdrop-blur-md border ${
                        isFree
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                      }`}
                    >
                      {isFree ? "Free RSVP" : `₹${event.price}`}
                    </span>
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">{event.title}</h1>
                  {event.hostName && (
                    <p className="text-sm text-text-secondary mt-2">
                      Hosted by <span className="text-text-primary font-semibold">{event.hostName}</span>
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-card border border-border-subtle">
                    <Calendar className="w-4 h-4 text-[var(--accent-orange)] mb-2" />
                    <p className="text-xs font-semibold text-text-primary">{when.date}</p>
                    <p className="text-[11px] text-text-secondary">{when.time}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border-subtle">
                    <MapPin className="w-4 h-4 text-[var(--accent-orange)] mb-2" />
                    <p className="text-xs font-semibold text-text-primary">{event.location}</p>
                    <p className="text-[11px] text-text-secondary">
                      {[event.zone, event.city, event.state].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border-subtle">
                    <Users className="w-4 h-4 text-[var(--accent-orange)] mb-2" />
                    <p className="text-xs font-semibold text-text-primary">{event.spotsLeft} spots left</p>
                    <p className="text-[11px] text-text-secondary">Capacity {event.capacity}</p>
                  </div>
                </div>

                <section className="p-6 rounded-3xl bg-card border border-border-subtle">
                  <h2 className="text-sm font-bold text-text-primary mb-3">About</h2>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </section>

                {event.schedule && (
                  <section className="p-6 rounded-3xl bg-card border border-border-subtle">
                    <h2 className="text-sm font-bold text-text-primary mb-3">Schedule</h2>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{event.schedule}</p>
                  </section>
                )}

                {event.prizePool && (
                  <section className="p-6 rounded-3xl bg-card border border-border-subtle">
                    <h2 className="text-sm font-bold text-text-primary mb-3">Prize pool</h2>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{event.prizePool}</p>
                  </section>
                )}
              </motion.div>

              <motion.aside
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-5"
              >
                <div className="lg:sticky lg:top-24 p-6 rounded-3xl bg-card border border-border-subtle shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[var(--accent-orange)]" />
                    <h2 className="text-sm font-bold text-text-primary">Your pass</h2>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
                    </p>
                  )}

                  {myRegistration ? (
                    <>
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        {myRegistration.status === "Waitlisted" ? "You are on the waitlist" : "You are registered"}
                      </div>
                      {myRegistration.ticketPass?.qrPayload && (
                        <TicketPassCard
                          title={event.title}
                          status={myRegistration.status}
                          location={event.location}
                          dateLabel={`${when.date} ${when.time}`}
                          payload={myRegistration.ticketPass.qrPayload}
                          passId={myRegistration.id}
                        />
                      )}
                      <Link href="/dashboard" className="block text-center text-xs font-semibold text-[var(--accent-orange)]">
                        View in dashboard
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {isFree
                          ? "Free pass. Issued to your signed-in account. No card data is collected."
                          : "Paid checkout is not live. You can still request a registration if the organiser marked this listing paid."}
                      </p>
                      {isFull && !event.waitlistEnabled && (
                        <p className="text-xs text-amber-300">This event is full.</p>
                      )}
                      <button
                        type="button"
                        disabled={busy || (isFull && !event.waitlistEnabled)}
                        onClick={register}
                        className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
                      >
                        {busy ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving
                          </span>
                        ) : authStatus !== "authenticated" ? (
                          "Sign in to register"
                        ) : isFull && event.waitlistEnabled ? (
                          "Join waitlist"
                        ) : (
                          "Get pass"
                        )}
                      </button>
                    </>
                  )}
                </div>
              </motion.aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
