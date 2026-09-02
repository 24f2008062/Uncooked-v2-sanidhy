"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/SupabaseProvider";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountNav from "@/components/account/AccountNav";
import TicketPassCard from "@/components/events/TicketPassCard";
import {
  Ticket,
  Briefcase,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";

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
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [passes, setPasses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
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

  const name = profile?.fullName || profile?.name || session?.user?.name || "there";
  const registrations = passes.length ? passes : profile?.registrations || [];
  const apps = profile?.opportunityApps || [];
  const host = profile?.hostApplication;
  const isHost =
    String(profile?.role || session?.user?.role || "").toUpperCase() === "ORGANIZER" ||
    String(profile?.role || session?.user?.role || "").toUpperCase() === "SUPER_ADMIN";

  return (
    <>
      <Navbar forceDarkTop />
      <main className="min-h-screen bg-primary pt-28 pb-24 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[320px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-orange)] mb-2">
              Student console
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              Welcome back, {name.split(" ")[0]}
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              Your passes, applications, and host status. Signed in as {session?.user?.email}
            </p>
          </div>

          <AccountNav />

          {isHost && (
            <div className="mb-6 p-4 rounded-2xl bg-card border border-border-subtle flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                Host tools: open an event page, copy its id, then scan passes at the door.
              </p>
              <Link href="/create" className="btn-secondary text-xs min-h-[44px] px-4 inline-flex items-center">
                Create event
              </Link>
            </div>
          )}

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-secondary gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading your workspace
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-card border border-border-subtle">
                  <Ticket className="w-4 h-4 text-[var(--accent-orange)] mb-3" />
                  <p className="text-2xl font-bold text-text-primary">{registrations.length}</p>
                  <p className="text-xs text-text-secondary">Event passes</p>
                </div>
                <div className="p-5 rounded-3xl bg-card border border-border-subtle">
                  <Briefcase className="w-4 h-4 text-purple-400 mb-3" />
                  <p className="text-2xl font-bold text-text-primary">{apps.length}</p>
                  <p className="text-xs text-text-secondary">Opportunity applications</p>
                </div>
                <div className="p-5 rounded-3xl bg-card border border-border-subtle">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mb-3" />
                  <p className="text-2xl font-bold text-text-primary">{host?.status || "None"}</p>
                  <p className="text-xs text-text-secondary">Host verification</p>
                </div>
              </div>

              <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--accent-orange)]" /> Your passes
                  </h2>
                  <Link href="/events" className="text-xs font-semibold text-[var(--accent-orange)] inline-flex items-center gap-1">
                    Browse events <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {registrations.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    No tickets yet. Register from an event page. The pass is bound to this account.
                  </p>
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

              <div className="grid lg:grid-cols-2 gap-6">
                <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle">
                  <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-400" /> Applications
                  </h2>
                  {apps.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      No applications. <Link href="/opportunities" className="underline text-text-primary">Open the board</Link>
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {apps.map((app) => (
                        <li key={app.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-text-primary truncate">{app.opportunity?.title || "Opportunity"}</span>
                          <span className="text-[10px] font-bold uppercase text-text-secondary">{app.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle">
                  <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" /> Hosting
                  </h2>
                  {profile?.role === "ORGANIZER" || profile?.role === "SUPER_ADMIN" ? (
                    <div className="space-y-3">
                      <p className="text-sm text-text-secondary">You can publish campus events.</p>
                      <Link
                        href="/host"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
                      >
                        Create an event
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-text-secondary">
                        {host
                          ? `Application status: ${host.status}.`
                          : "Verified hosts can publish events. Apply with your club or organisation details."}
                      </p>
                      <Link href="/host/apply" className="text-xs font-semibold text-[var(--accent-orange)] inline-flex items-center gap-1">
                        {host ? "View application" : "Apply to host"} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
