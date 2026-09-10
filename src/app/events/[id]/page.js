"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SupabaseProvider";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LazyAgentWidget from "@/components/ui/LazyAgentWidget";
import TicketPassCard from "@/components/events/TicketPassCard";
import EventBroadcastPanel from "@/components/events/EventBroadcastPanel";
import GoogleMapsButton from "@/components/ui/GoogleMapsButton";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Megaphone,
  Share2,
  Copy,
  Check,
  Search,
  UserCheck,
  Clock,
  Sparkles,
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
  const [isHost, setIsHost] = useState(false);
  const [hostDashboard, setHostDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeeFilter, setAttendeeFilter] = useState("all"); // "all" | "checked_in" | "registered"

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
      setIsHost(Boolean(payload.data.isHost));
      setHostDashboard(payload.data.hostDashboard || null);
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

  const copyEventLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

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

  const filteredAttendees = (hostDashboard?.attendees || []).filter((att) => {
    const matchesSearch =
      !attendeeSearch ||
      att.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      (att.email && att.email.toLowerCase().includes(attendeeSearch.toLowerCase()));
    if (!matchesSearch) return false;
    if (attendeeFilter === "checked_in") return att.checkInStatus;
    if (attendeeFilter === "registered") return !att.checkInStatus;
    return true;
  });

  return (
    <>
      <Navbar forceDarkTop />
      <LazyAgentWidget />
      <main className="min-h-screen bg-primary pt-28 pb-24 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-orange-500/10 rounded-full blur-2xl md:blur-[140px] opacity-50 md:opacity-100 pointer-events-none" />

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
            <>
              {/* Host Top Banner */}
              {isHost && (
                <div className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--accent-orange)]/20 border border-[var(--accent-orange)]/40 flex items-center justify-center text-[var(--accent-orange)] shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[var(--accent-orange)]">Host Management Console</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/10 text-white/90 border border-white/10">Organizer View</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        You are hosting this event. Scan attendee passes at the door, dispatch broadcasts, and monitor guest check-ins.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/host/scanner/${encodeURIComponent(id)}`}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-98 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pass Scanner</span>
                    </Link>
                    <a
                      href="#broadcasts"
                      className="px-4 py-2 rounded-xl bg-card border border-border-subtle hover:bg-card-hover text-text-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                      <span>Broadcast</span>
                    </a>
                  </div>
                </div>
              )}

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
                      unoptimized={Boolean(event.bannerUrl && !event.bannerUrl.startsWith("/") && !event.bannerUrl.includes("unsplash.com"))}
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
                    <div className="p-4 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between">
                      <div>
                        <MapPin className="w-4 h-4 text-[var(--accent-orange)] mb-2" />
                        <p className="text-xs font-semibold text-text-primary">{event.location}</p>
                        <p className="text-[11px] text-text-secondary">
                          {[event.zone, event.city, event.state].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {event.location && (
                        <div className="mt-3 pt-2.5 border-t border-border-subtle">
                          <GoogleMapsButton
                            location={event.location}
                            city={event.city}
                            state={event.state}
                            label="Open in Google Maps"
                            className="w-full justify-center !bg-background hover:!bg-card-hover border-border-subtle shadow-sm"
                          />
                        </div>
                      )}
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

                  {/* Broadcast Channel */}
                  <EventBroadcastPanel
                    eventId={id}
                    enabled={authStatus === "authenticated"}
                    isHost={isHost}
                  />

                  {/* Host Attendee Management Roster */}
                  {isHost && (
                    <section id="attendees-roster" className="p-6 rounded-3xl bg-card border border-border-subtle space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-[var(--accent-orange)]" />
                          <h2 className="text-sm font-bold text-text-primary">Attendee Roster & Check-In Desk</h2>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                            {hostDashboard?.attendees?.length || 0} Registered
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAttendeeFilter("all")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              attendeeFilter === "all" ? "bg-[var(--accent-orange)] text-white" : "bg-card border border-border-subtle text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            All ({hostDashboard?.attendees?.length || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendeeFilter("checked_in")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              attendeeFilter === "checked_in" ? "bg-emerald-500 text-white" : "bg-card border border-border-subtle text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            Checked In ({hostDashboard?.checkedInCount || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendeeFilter("registered")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              attendeeFilter === "registered" ? "bg-blue-500 text-white" : "bg-card border border-border-subtle text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            Not Checked In ({Math.max(0, (hostDashboard?.totalRegistrations || 0) - (hostDashboard?.checkedInCount || 0))})
                          </button>
                        </div>
                      </div>

                      {/* Search Filter */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-text-muted absolute top-1/2 -translate-y-1/2 left-3" />
                        <input
                          type="text"
                          placeholder="Search registered attendees by name or email…"
                          value={attendeeSearch}
                          onChange={(e) => setAttendeeSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-background/60 border border-border-subtle text-xs text-text-primary outline-none focus:border-[var(--accent-orange)] transition-colors"
                        />
                      </div>

                      {/* Attendees List */}
                      {filteredAttendees.length === 0 ? (
                        <div className="py-8 text-center rounded-2xl bg-background/20 border border-border-subtle text-xs text-text-secondary">
                          {attendeeSearch ? "No attendees match your search query." : "No attendees registered yet."}
                        </div>
                      ) : (
                        <div className="divide-y divide-border-subtle rounded-2xl border border-border-subtle overflow-hidden bg-background/30 max-h-96 overflow-y-auto">
                          {filteredAttendees.map((att) => (
                            <div key={att.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-text-primary truncate">{att.name}</p>
                                  {att.checkInStatus ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Checked In
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/10 text-white/60">
                                      Registered
                                    </span>
                                  )}
                                </div>
                                {att.email && (
                                  <p className="text-[11px] text-text-muted truncate mt-0.5 font-mono">{att.email}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-text-muted block font-mono">
                                  {att.registeredAt ? new Date(att.registeredAt).toLocaleDateString() : ""}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

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
                  {isHost ? (
                    /* DEDICATED HOST MANAGEMENT CONSOLE */
                    <div className="lg:sticky lg:top-24 p-6 rounded-3xl bg-card border border-border-subtle shadow-xl space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[var(--accent-orange)]" />
                          <h2 className="text-sm font-bold text-text-primary">Organizer Desk</h2>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {event.status}
                        </span>
                      </div>

                      {/* Registration & Check-In Meters */}
                      <div className="p-4 rounded-2xl bg-background/60 border border-border-subtle space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-text-secondary font-medium">Registrations</span>
                            <span className="font-bold text-text-primary">
                              {hostDashboard?.totalRegistrations ?? event.registrationCount} / {event.capacity}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(
                                    ((hostDashboard?.totalRegistrations ?? event.registrationCount) / Math.max(1, event.capacity)) * 100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-text-muted mt-1.5 font-mono">
                            <span>{event.spotsLeft} spots remaining</span>
                            <span>
                              {Math.round(
                                ((hostDashboard?.totalRegistrations ?? event.registrationCount) / Math.max(1, event.capacity)) * 100
                              )}% filled
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                          <span className="text-text-secondary font-medium">Door Check-ins</span>
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />
                            {hostDashboard?.checkedInCount ?? 0} verified guests
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-2.5 pt-1">
                        <Link
                          href={`/host/scanner/${encodeURIComponent(id)}`}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Launch QR Pass Scanner</span>
                        </Link>

                        <a
                          href="#broadcasts"
                          className="w-full py-2.5 px-4 rounded-xl bg-card border border-border-subtle hover:bg-card-hover text-text-primary font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Megaphone className="w-4 h-4 text-[var(--accent-orange)]" />
                          <span>Broadcast to Attendees</span>
                        </a>

                        <button
                          type="button"
                          onClick={copyEventLink}
                          className="w-full py-2.5 px-4 rounded-xl bg-card border border-border-subtle hover:bg-card-hover text-text-primary font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Link Copied to Clipboard</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-text-muted" />
                              <span>Share Public Event Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Recent Roster Snapshot */}
                      {hostDashboard?.attendees?.length > 0 && (
                        <div className="pt-3 border-t border-border-subtle">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-semibold text-text-primary">Recent Registrations</span>
                            <a href="#attendees-roster" className="text-[11px] text-[var(--accent-orange)] hover:underline">
                              View all →
                            </a>
                          </div>
                          <div className="space-y-2">
                            {hostDashboard.attendees.slice(0, 3).map((att) => (
                              <div key={att.id} className="p-2.5 rounded-xl bg-background/40 border border-border-subtle flex items-center justify-between text-xs">
                                <span className="text-text-primary font-medium truncate">{att.name}</span>
                                {att.checkInStatus ? (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Checked In
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-text-muted">Registered</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link
                        href="/dashboard"
                        className="block text-center text-xs font-semibold text-[var(--accent-orange)] hover:underline pt-1"
                      >
                        ← Return to Dashboard
                      </Link>
                    </div>
                  ) : (
                    /* NORMAL ATTENDEE SCREEN */
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
                            className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 cursor-pointer"
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
                  )}
                </motion.aside>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
