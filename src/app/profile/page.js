"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSession } from "@/components/providers/SupabaseProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Calendar,
  Settings,
  Ticket,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const AVATAR_OPTIONS = [
  { id: "male", name: "Executive Male", src: "/avatars/male.svg" },
  { id: "female", name: "Professional Female", src: "/avatars/female.svg" },
  { id: "rockstar", name: "Rockstar Artist", src: "/avatars/rockstar.svg" },
  { id: "astronaut", name: "Space Explorer", src: "/avatars/astronaut.svg" },
  { id: "cyberpunk", name: "Cyberpunk Hacker", src: "/avatars/cyberpunk.svg" },
  { id: "exciting", name: "Party Excitement", src: "/avatars/exciting.svg" },
];

export default function ViewProfilePage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("events"); // "events" | "attended"
  const [selectedAvatarId, setSelectedAvatarId] = useState("astronaut");
  const [loading, setLoading] = useState(true);

  // Profile data - Clean real initial state with ZERO fake data
  const [profileData, setProfileData] = useState({
    name: "",
    username: "",
    joinedDate: "",
    hostedCount: 0,
    attendedCount: 0,
    bio: "",
    socials: {
      linkedin: "",
      x: "",
      instagram: "",
      website: "",
    },
  });

  useEffect(() => {
    // 1. Read avatar from localStorage
    const storedAvatar = localStorage.getItem("user_selected_avatar");
    if (storedAvatar && AVATAR_OPTIONS.some((a) => a.id === storedAvatar)) {
      setSelectedAvatarId(storedAvatar);
    }

    // 2. Read stored settings from localStorage if user specifically saved them
    const storedSettings = localStorage.getItem("user_settings_profile");
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        const savedFullName = [parsed.firstName, parsed.lastName].filter(Boolean).join(" ").trim();
        setProfileData((prev) => ({
          ...prev,
          ...(savedFullName ? { name: savedFullName } : {}),
          ...(parsed.username ? { username: parsed.username } : {}),
          ...(parsed.bio ? { bio: parsed.bio } : {}),
          socials: {
            linkedin: parsed.socials?.linkedin || "",
            x: parsed.socials?.x || "",
            instagram: parsed.socials?.instagram || "",
            website: parsed.socials?.website || "",
          },
        }));
      } catch (err) {
        console.error(err);
      }
    }

    // 3. Fetch backend profile
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && payload.data?.user) {
          const u = payload.data.user;
          setUser(u);

          let joinString = "";
          if (u.createdAt) {
            const d = new Date(u.createdAt);
            joinString = `Joined ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
          }

          const registrationsCount = Array.isArray(u.registrations) ? u.registrations.length : 0;
          const hostedCount = Array.isArray(u.eventsCreated) ? u.eventsCreated.length : 0;

          setProfileData((prev) => ({
            ...prev,
            name: u.fullName || u.name || prev.name,
            joinedDate: joinString || prev.joinedDate,
            hostedCount,
            attendedCount: registrationsCount,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId) || AVATAR_OPTIONS[3]; // default astronaut

  const displayName =
    profileData.name ||
    session?.user?.fullName ||
    session?.user?.name ||
    (session?.user?.email ? session.user.email.split("@")[0] : "") ||
    "Demo User";

  const displayJoinedDate =
    profileData.joinedDate ||
    (session?.user?.createdAt
      ? `Joined ${new Date(session.user.createdAt).toLocaleString("en-US", { month: "long" })} ${new Date(session.user.createdAt).getFullYear()}`
      : "Joined Recently");

  const hasAnySocial = Boolean(
    profileData.socials?.linkedin?.trim() ||
    profileData.socials?.x?.trim() ||
    profileData.socials?.instagram?.trim() ||
    profileData.socials?.website?.trim()
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-primary text-text-primary transition-colors duration-200 pt-24 sm:pt-32 pb-36">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* ================================================================= */}
          {/* PROFILE HEADER */}
          {/* ================================================================= */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Avatar Circle */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-border-subtle bg-secondary shadow-2xl shrink-0">
              <Image
                src={activeAvatar.src}
                alt={activeAvatar.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, 112px"
                priority
              />
            </div>

            {/* Profile Information & Counts */}
            <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-text-primary truncate">
                  {displayName}
                </h1>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-card-hover border border-border-subtle text-text-primary text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
                  title="Settings & Profile Edit"
                >
                  <Settings className="w-3.5 h-3.5 text-text-secondary" />
                  <span className="hidden sm:inline">{t("nav.settings", "Settings")}</span>
                </Link>
              </div>

              {/* Joined Date */}
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                <span>{displayJoinedDate}</span>
              </div>

              {/* Stats: Real Hosted & Attended Counts */}
              <div className="flex items-center gap-4 text-xs pt-0.5">
                <div>
                  <span className="font-bold text-text-primary text-sm mr-1">{profileData.hostedCount}</span>
                  <span className="text-text-muted">{t("events.categories.hosted", "Hosted")}</span>
                </div>
                <div>
                  <span className="font-bold text-text-primary text-sm mr-1">{profileData.attendedCount}</span>
                  <span className="text-text-muted">{t("profile.stats.attended", "Attended")}</span>
                </div>
              </div>

              {/* Social Links - ONLY rendered if user actually added them */}
              {hasAnySocial && (
                <div className="flex items-center gap-2.5 pt-1 text-text-secondary">
                  {profileData.socials?.linkedin?.trim() && (
                    <a
                      href={`https://linkedin.com/in/${profileData.socials.linkedin.replace(/^.*linkedin\.com\/in\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:text-text-primary transition-colors"
                      title="LinkedIn"
                    >
                      <LinkedInIcon className="w-4 h-4" />
                    </a>
                  )}
                  {profileData.socials?.x?.trim() && (
                    <a
                      href={`https://x.com/${profileData.socials.x.replace(/^.*x\.com\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:text-text-primary transition-colors"
                      title="X"
                    >
                      <XIcon className="w-4 h-4" />
                    </a>
                  )}
                  {profileData.socials?.instagram?.trim() && (
                    <a
                      href={`https://instagram.com/${profileData.socials.instagram.replace(/^.*instagram\.com\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:text-text-primary transition-colors"
                      title="Instagram"
                    >
                      <InstagramIcon className="w-4 h-4" />
                    </a>
                  )}
                  {profileData.socials?.website?.trim() && (
                    <a
                      href={profileData.socials.website.startsWith("http") ? profileData.socials.website : `https://${profileData.socials.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:text-text-primary transition-colors"
                      title="Personal Website"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio text if present */}
          {profileData.bio && (
            <p className="mt-4 text-xs text-text-secondary leading-relaxed max-w-xl">
              {profileData.bio}
            </p>
          )}

          {/* Subtle Horizontal Divider Line */}
          <div className="border-t border-border-subtle my-8 sm:my-10" />

          {/* Tabs for Hosted vs Attended */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 mb-8 sm:mb-12 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab("events")}
              className={`relative pb-2 font-semibold transition-colors cursor-pointer ${
                activeTab === "events" ? "text-text-primary" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span>{t("profile.tabs.hosted", "Hosted Events")} ({profileData.hostedCount})</span>
              {activeTab === "events" && (
                <motion.div
                  layoutId="profileTabLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-orange)] rounded-full"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab("attended")}
              className={`relative pb-2 font-semibold transition-colors cursor-pointer ${
                activeTab === "attended" ? "text-text-primary" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span>{t("profile.tabs.attended", "Attended")} ({profileData.attendedCount})</span>
              {activeTab === "attended" && (
                <motion.div
                  layoutId="profileTabLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-orange)] rounded-full"
                />
              )}
            </button>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: HOSTED EVENTS */}
          {/* ================================================================= */}
          {activeTab === "events" && (
            user?.eventsCreated && user.eventsCreated.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {user.eventsCreated.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl bg-card border border-border-subtle hover:border-border-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">{ev.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Host
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          {ev.startsAt
                            ? new Date(ev.startsAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Upcoming"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-text-muted" />
                          {ev.venueName || "Main Campus"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/events/${ev.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-card-hover border border-border-subtle text-xs font-semibold text-text-primary transition-colors self-start sm:self-auto"
                    >
                      <span>{t("events.manageEvent", "Manage Event")}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 flex flex-col items-center justify-center text-center"
              >
                <CalendarEmptyIllustration />

                <h2 className="text-base sm:text-lg font-bold text-text-primary mt-6 mb-1">
                  {t("events.nothingHere", "Nothing Here, Yet")}
                </h2>
                <p className="text-xs sm:text-sm text-text-muted max-w-sm">
                  {displayName} {t("events.noPublicEvents", "has no public events at this time.")}
                </p>

                <div className="mt-6">
                  <Link
                    href="/host"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-card-hover border border-border-subtle text-text-primary text-xs font-bold transition-all shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t("nav.hostAnEvent", "Host an Event")}</span>
                  </Link>
                </div>
              </motion.div>
            )
          )}

          {/* ================================================================= */}
          {/* TAB 2: ATTENDED EVENTS */}
          {/* ================================================================= */}
          {activeTab === "attended" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {user?.registrations && user.registrations.length > 0 ? (
                <div className="space-y-3">
                  {user.registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 rounded-2xl bg-card border border-border-subtle hover:border-border-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary">
                            {reg.event?.title || "Campus Event"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-text-secondary border border-border-subtle">
                            {reg.status || "CONFIRMED"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-text-muted" />
                            {reg.event?.startsAt
                              ? new Date(reg.event.startsAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Upcoming"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-text-muted" />
                            {reg.event?.venueName || "Main Campus Hall"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/events/${reg.eventId || ""}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-card-hover border border-border-subtle text-xs font-semibold text-text-primary transition-colors self-start sm:self-auto"
                      >
                        <Ticket className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t("dashboard.passes.viewPass", "View Ticket")}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary border border-border-subtle flex items-center justify-center text-text-muted mb-4 shadow-md">
                    <Ticket className="w-8 h-8 text-text-muted" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-text-primary mb-1">
                    {t("events.nothingHere", "Nothing Here, Yet")}
                  </h2>
                  <p className="text-xs sm:text-sm text-text-muted max-w-sm">
                    {displayName} {t("events.noRegistrations", "has not registered for any events yet.")}
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-card-hover border border-border-subtle text-text-primary text-xs font-bold transition-all shadow-sm"
                    >
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      <span>{t("events.browseEvents", "Browse Campus Events")}</span>
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Adaptive Theme Calendar-0 Illustration
// ---------------------------------------------------------------------------
function CalendarEmptyIllustration() {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg
        width="112"
        height="112"
        viewBox="0 0 112 112"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-80"
      >
        {/* Calendar Body */}
        <rect
          x="12"
          y="18"
          width="82"
          height="82"
          rx="18"
          fill="var(--bg-secondary)"
          stroke="var(--border-subtle)"
          strokeWidth="3.5"
        />

        {/* Top binder bar line */}
        <rect x="20" y="27" width="54" height="8" rx="4" fill="var(--border-hover)" />

        {/* Calendar Event Grid blocks */}
        <rect x="20" y="44" width="18" height="12" rx="3" fill="var(--border-subtle)" />
        <rect x="42" y="44" width="18" height="20" rx="3" fill="var(--border-hover)" />
        <rect x="20" y="60" width="18" height="22" rx="3" fill="var(--border-subtle)" />
        <rect x="42" y="68" width="18" height="8" rx="3" fill="var(--border-hover)" />
        <rect x="64" y="56" width="16" height="18" rx="3" fill="var(--border-subtle)" />

        {/* Floating Notification Badge with "0" */}
        <g filter="drop-shadow(0 4px 8px rgba(0,0,0,0.25))">
          <circle
            cx="84"
            cy="20"
            r="16"
            fill="var(--bg-card)"
            stroke="var(--border-hover)"
            strokeWidth="3"
          />
          <text
            x="84"
            y="25"
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="15"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            0
          </text>
        </g>
      </svg>
    </div>
  );
}

// Brand Icons
function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.92 0 1.67-.75 1.67-1.67 0-.92-.75-1.67-1.67-1.67-.92 0-1.67.75-1.67 1.67 0 .92.75 1.67 1.67 1.67M7.85 18.5V10.1H5.07v8.4h2.78z" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
