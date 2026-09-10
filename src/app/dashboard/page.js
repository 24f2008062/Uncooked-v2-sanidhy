"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SupabaseProvider";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import TicketPassCard from "@/components/events/TicketPassCard";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Ticket,
  Briefcase,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Loader2,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  QrCode,
  Users,
  LogIn,
} from "lucide-react";

const PixelBlast = dynamic(
  () => import("@/components/ui/PixelBlast"),
  {
    ssr: false,
    loading: () => null,
  }
);
import DeferredWebGL from "@/components/ui/DeferredWebGL";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  {
    ssr: false,
    loading: () => <div className="w-24 h-24 bg-white/10 rounded-lg animate-pulse" />,
  }
);

const LIVE_EVENTS_CATALOG = [
  {
    id: "ai-llm-summit",
    title: "AI & Generative LLM Summit 2026",
    category: "Hackathons",
    host: "Developer Society UIC",
    date: "Sep 15, 2026",
    time: "10:00 AM",
    location: "Main Auditorium, Block C",
    price: "Free RSVP",
    isFree: true,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop",
    attendees: "340 registered",
  },
  {
    id: "neon-sunset-fest",
    title: "Neon Sunset Beach Fest 2026",
    category: "Cultural Fests",
    host: "Campus Cultural Board",
    date: "Sep 20, 2026",
    time: "6:00 PM",
    location: "Sunset Pavilion Grounds",
    price: "₹499 Ticket",
    isFree: false,
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop",
    attendees: "850 registered",
  },
  {
    id: "cybersec-bootcamp",
    title: "CyberSecurity & Ethical Hacking",
    category: "Workshops",
    host: "CyberSec Club",
    date: "Oct 02, 2026",
    time: "2:00 PM",
    location: "Tech Lab 4, Science Wing",
    price: "Free RSVP",
    isFree: true,
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
    attendees: "190 registered",
  },
  {
    id: "esports-arena",
    title: "Inter College Valorant & CS2 Arena",
    category: "Sports & Gaming",
    host: "Campus Gaming Guild",
    date: "Oct 10, 2026",
    time: "11:00 AM",
    location: "Student Recreation Center",
    price: "Free RSVP",
    isFree: true,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
    attendees: "510 registered",
  },
  {
    id: "startup-pitch-night",
    title: "Campus Startup Pitch Night & Mixer",
    category: "Parties & Socials",
    host: "Entrepreneurship Hub",
    date: "Oct 18, 2026",
    time: "7:00 PM",
    location: "Innovation Lounge",
    price: "Free RSVP",
    isFree: true,
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop",
    attendees: "220 registered",
  },
  {
    id: "acoustic-indie-night",
    title: "Acoustic Night & Indie Music Session",
    category: "Cultural Fests",
    host: "Music Society",
    date: "Nov 05, 2026",
    time: "5:00 PM",
    location: "Open Amphitheater",
    price: "Free RSVP",
    isFree: true,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
    attendees: "430 registered",
  },
];

function formatWhen(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [passes, setPasses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated guests to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirectTo=/dashboard");
    }
  }, [status, router]);

  // Live campus events & booking states
  const [liveEvents, setLiveEvents] = useState(LIVE_EVENTS_CATALOG);
  const [selectedEventForBooking, setSelectedEventForBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [newlyCreatedPass, setNewlyCreatedPass] = useState(null);

  // Fetch session data (profile & registrations)
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    Promise.all([fetch("/api/user/profile"), fetch("/api/registrations")])
      .then(async ([profileRes, passRes]) => {
        const profilePayload = await profileRes.json();
        const passPayload = await passRes.json();
        if (profilePayload.success) setProfile(profilePayload.data.user);
        else setError(profilePayload.error?.message || "Unable to load dashboard");
        if (passPayload.success) setPasses(passPayload.data.registrations || []);
      })
      .catch(() => setError("Unable to load dashboard"))
      .finally(() => setLoading(false));
  }, [status]);

  // Fetch live campus events catalog
  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && Array.isArray(payload.data) && payload.data.length > 0) {
          const rows = payload.data;
          setLiveEvents(
            rows.map((row) => ({
              id: row.id,
              title: row.title,
              category: row.category || row.type || "Events",
              host: row.hostName || "Campus Host",
              date: row.date ? new Date(row.date).toLocaleDateString() : "",
              time: row.date ? new Date(row.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              location: row.location,
              price: row.ticketType === "Paid" ? `₹${row.price}` : "Free RSVP",
              isFree: row.ticketType !== "Paid",
              image: row.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop",
              attendees: `${row.spotsLeft ?? row.capacity ?? 0} spots left`,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const name = profile?.fullName || profile?.name || session?.user?.name || "Student";
  const registrations = passes.length ? passes : profile?.registrations || [];
  const apps = profile?.opportunityApps || [];
  const host = profile?.hostApplication;
  const isHost =
    String(profile?.role || session?.user?.role || "").toUpperCase() === "ORGANIZER" ||
    String(profile?.role || session?.user?.role || "").toUpperCase() === "SUPER_ADMIN";

  const handleOpenBooking = (event) => {
    if (status !== "authenticated") {
      router.push(`/login?redirectTo=/dashboard`);
      return;
    }
    setSelectedEventForBooking(event);
    setBookingError("");
    setNewlyCreatedPass(null);
  };

  const handleCreateTicket = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEventForBooking) return;
    setBookingLoading(true);
    setBookingError("");

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventForBooking.id }),
      });
      const payload = await res.json();

      if (res.status === 401) {
        router.push("/login?redirectTo=/dashboard");
        return;
      }

      if (!res.ok) {
        setBookingError(payload.error?.message || "Could not complete registration.");
        return;
      }

      const pass = payload.data?.ticketPass || null;
      setNewlyCreatedPass({
        ...pass,
        eventTitle: selectedEventForBooking.title,
        date: selectedEventForBooking.date,
        location: selectedEventForBooking.location,
      });

      // Refresh registrations
      const regRes = await fetch("/api/registrations");
      const regData = await regRes.json();
      if (regData.success && regData.data?.registrations) {
        setPasses(regData.data.registrations);
      }
    } catch {
      setBookingError("Unable to create ticket right now. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const isEventRegistered = (eventId) => {
    return registrations.some((reg) => reg.event?.id === eventId || reg.eventId === eventId);
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-primary pt-28 pb-24 flex items-center justify-center">
          <div className="flex items-center text-text-secondary gap-2.5">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-orange)]" />
            <span className="text-sm font-medium">
              {status === "loading" ? "Loading your dashboard..." : "Redirecting to sign in..."}
            </span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-primary pt-28 pb-24 relative overflow-hidden">
        <DeferredWebGL
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          fallback={
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent" />
          }
        >
          <PixelBlast
            variant="square"
            pixelSize={3.5}
            color={theme === "light" ? "#ea580c" : "#fb923c"}
            patternScale={2.5}
            patternDensity={1.1}
            speed={0.4}
            edgeFade={0.25}
            transparent={true}
            enableRipples={true}
            className="w-full h-full opacity-70 dark:opacity-55"
          />
        </DeferredWebGL>

        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[320px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1150px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              {t("dashboard.title", "Student Console")}
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              {t("dashboard.subtitle", "Browse live campus events, claim passes, and track applications.")}
            </p>
          </div>

          {isHost && (
            <div className="mb-6 p-4 rounded-2xl bg-card border border-border-subtle flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                {t("nav.hostTools", "Host tools: scan attendee passes at the door with the pass scanner.")}
              </p>
              <Link href="/create" className="btn-secondary text-xs min-h-[40px] px-4 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                <span>{t("nav.createEvent", "Create Event")}</span>
              </Link>
            </div>
          )}

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-secondary gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> {t("common.loading", "Loading your workspace")}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              {/* Quick Summary Metrics */}
              {status === "authenticated" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-card border border-border-subtle">
                    <Ticket className="w-4 h-4 text-[var(--accent-orange)] mb-3" />
                    <p className="text-2xl font-bold text-text-primary">{registrations.length}</p>
                    <p className="text-xs text-text-secondary">{t("dashboard.stats.passes", "Event passes")}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-card border border-border-subtle">
                    <Briefcase className="w-4 h-4 text-purple-400 mb-3" />
                    <p className="text-2xl font-bold text-text-primary">{apps.length}</p>
                    <p className="text-xs text-text-secondary">{t("dashboard.stats.applications", "Opportunity applications")}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-card border border-border-subtle">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 mb-3" />
                    <p className="text-2xl font-bold text-text-primary">{host?.status || t("common.none", "None")}</p>
                    <p className="text-xs text-text-secondary">{t("dashboard.stats.hostStatus", "Host verification")}</p>
                  </div>
                </div>
              )}

              {/* SECTION: Live Campus Events (Direct Ticket Pass Creation) */}
              <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" /> {t("dashboard.liveEvents.title", "Live Campus Events")}
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">
                      {t("dashboard.liveEvents.subtitle", "RSVP and generate your official digital ticket pass directly from your dashboard.")}
                    </p>
                  </div>
                  <Link
                    href="/events"
                    className="text-xs font-semibold text-[var(--accent-orange)] inline-flex items-center gap-1 hover:underline"
                  >
                    {t("events.hero.viewCatalog", "View catalog page")} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {liveEvents.slice(0, 3).map((ev) => {
                    const alreadyClaimed = isEventRegistered(ev.id);
                    return (
                      <div
                        key={ev.id}
                        className="rounded-2xl bg-background border border-border-subtle overflow-hidden flex flex-col transition-all duration-200 hover:border-white/20 group"
                      >
                        {/* Event Banner */}
                        <div className="relative w-full h-36 overflow-hidden bg-white/5">
                          <Image
                            src={ev.image}
                            alt={ev.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                              {ev.category}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                                ev.isFree
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                              }`}
                            >
                              {ev.price}
                            </span>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h3 className="text-sm font-bold text-text-primary line-clamp-1 group-hover:text-[var(--accent-orange)] transition-colors">
                              {ev.title}
                            </h3>
                            <p className="text-[11px] text-text-secondary mt-0.5 truncate">
                              Hosted by {ev.host}
                            </p>
                            <div className="space-y-1 mt-2.5 text-[11px] text-text-secondary">
                              <div className="flex items-center gap-1.5 truncate">
                                <Calendar className="w-3 h-3 text-[var(--accent-orange)] shrink-0" />
                                <span>{ev.date} • {ev.time}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                                <span className="truncate">{ev.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <Users className="w-3 h-3 text-blue-400 shrink-0" />
                                <span>{ev.attendees}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2 border-t border-border-subtle">
                            {alreadyClaimed ? (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4" /> {t("dashboard.liveEvents.passClaimed", "Pass Claimed")}
                                </span>
                                <Link
                                  href={`/events/${ev.id}`}
                                  className="text-[11px] font-semibold text-text-secondary hover:text-white"
                                >
                                  {t("common.details", "Details")} →
                                </Link>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenBooking(ev)}
                                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                              >
                                <Ticket className="w-3.5 h-3.5" />
                                <span>{t("dashboard.liveEvents.getTicket", "Get Ticket Pass")}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION: Your Passes */}
              {status === "authenticated" && (
                <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle" id="passes-section">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--accent-orange)]" /> {t("dashboard.passes.title", "Your Active Passes")} ({registrations.length})
                    </h2>
                  </div>
                  {registrations.length === 0 ? (
                    <div className="text-center py-8 px-4 rounded-2xl bg-background/50 border border-border-subtle">
                      <Ticket className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-semibold text-text-primary">{t("dashboard.passes.noPassesTitle", "No tickets claimed yet")}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {t("dashboard.passes.noPasses", "Select any live event above and click 'Get Ticket Pass' to generate your digital entry pass.")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {registrations.map((reg) => (
                        <Link key={reg.id} href={`/events/${reg.event?.id || ""}`} className="block">
                          <TicketPassCard
                            title={reg.event?.title || "Event"}
                            status={reg.status}
                            location={reg.event?.location}
                            dateLabel={formatWhen(reg.event?.date)}
                            payload={reg.ticketPass?.qrPayload || null}
                            passId={reg.id}
                          />
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* SECTION: Applications & Hosting */}
              {status === "authenticated" && (
                <div className="grid lg:grid-cols-2 gap-6">
                  <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle">
                    <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-400" /> {t("dashboard.stats.applications", "Opportunity Applications")}
                    </h2>
                    {apps.length === 0 ? (
                      <p className="text-sm text-text-secondary">
                        No applications yet.{" "}
                        <Link href="/opportunities" className="underline text-text-primary">
                          Open the opportunities board
                        </Link>
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {apps.map((app) => (
                          <li key={app.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-text-primary truncate">
                              {app.opportunity?.title || "Opportunity"}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-text-secondary">
                              {app.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle">
                    <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" /> {t("dashboard.stats.hostStatus", "Hosting Status")}
                    </h2>
                    {profile?.role === "ORGANIZER" || profile?.role === "SUPER_ADMIN" ? (
                      <div className="space-y-3">
                        <p className="text-sm text-text-secondary">
                          Your host credentials are active. You can create and publish campus events.
                        </p>
                        <Link
                          href="/create"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md"
                          style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
                        >
                          Create an Event
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-text-secondary">
                          {host
                            ? `Host application status: ${host.status}.`
                            : "Verified student hosts can publish campus events. Apply with your club or organisation details."}
                        </p>
                        <Link
                          href="/host/apply"
                          className="text-xs font-semibold text-[var(--accent-orange)] inline-flex items-center gap-1 hover:underline"
                        >
                          {host ? "View application" : "Apply to host"} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Interactive Ticket Pass Creation / Booking Modal */}
        <AnimatePresence>
          {selectedEventForBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md rounded-3xl bg-[#151518] border border-white/15 p-6 shadow-2xl text-white relative"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventForBooking(null);
                    setNewlyCreatedPass(null);
                    setBookingError("");
                  }}
                  className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {!newlyCreatedPass ? (
                  /* Step 1: Confirmation Form */
                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--accent-orange)] text-xs font-bold uppercase tracking-wider">
                      <Ticket className="w-4 h-4" />
                      <span>{t("dashboard.liveEvents.registerModalTitle", "Claim Event Ticket")}</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedEventForBooking.title}</h3>
                      <p className="text-xs text-white/50 mt-0.5">
                        Hosted by {selectedEventForBooking.host}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-white/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
                        <span>{selectedEventForBooking.date} • {selectedEventForBooking.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{selectedEventForBooking.location}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                        <span className="text-white/60">Ticket Price</span>
                        <span className="font-bold text-white">{selectedEventForBooking.price}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/50">
                      Pass will be linked to your account: <span className="text-white/90 font-mono">{session?.user?.email}</span>
                    </div>

                    {bookingError && (
                      <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                        {bookingError}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEventForBooking(null)}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t("common.cancel", "Cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{t("common.loading", "Generating Pass...")}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t("dashboard.liveEvents.confirmPass", "Confirm & Claim Pass")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Generated Ticket Pass Display */
                  <div className="text-center space-y-4 py-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{t("dashboard.passes.claimedBadge", "Ticket Pass Confirmed!")}</h3>
                      <p className="text-xs text-white/60 mt-1">
                        Your pass for <span className="text-white font-semibold">{newlyCreatedPass.eventTitle}</span> is ready.
                      </p>
                    </div>

                    {/* QR Code Presentation */}
                    <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-xl">
                      {newlyCreatedPass.qrPayload ? (
                        <QRCodeSVG value={newlyCreatedPass.qrPayload} size={140} level="M" />
                      ) : (
                        <div className="w-[140px] h-[140px] bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs">
                          <QrCode className="w-12 h-12 opacity-40" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] font-mono text-[var(--accent-orange)]">
                      PASS {newlyCreatedPass.id || "CONFIRMED"}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventForBooking(null);
                        setNewlyCreatedPass(null);
                        const section = document.getElementById("passes-section");
                        if (section) section.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {t("dashboard.passes.viewPass", "View in Your Passes")}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
