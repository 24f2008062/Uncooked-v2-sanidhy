"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSession } from "@/components/providers/SupabaseProvider";
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
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("events"); // "events" | "attended"
  const [selectedAvatarId, setSelectedAvatarId] = useState("male");
  const [loading, setLoading] = useState(true);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: "Siddhartha Singh",
    username: "siddhartha",
    joinedDate: "Joined September 2025",
    hostedCount: 0,
    attendedCount: 27,
    bio: "",
    socials: {
      linkedin: "siddharthasingh",
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

    // 2. Read stored settings from localStorage
    const storedSettings = localStorage.getItem("user_settings_profile");
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setProfileData((prev) => ({
          ...prev,
          name: `${parsed.firstName || "Siddhartha"} ${parsed.lastName || "Singh"}`.trim(),
          username: parsed.username || prev.username,
          bio: parsed.bio || prev.bio,
          socials: parsed.socials || prev.socials,
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

          let joinString = "Joined September 2025";
          if (u.createdAt) {
            const d = new Date(u.createdAt);
            joinString = `Joined ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
          }

          const registrationsCount = u.registrations?.length || 27;
          const hostedCount = u.eventsCreated?.length || 0;

          setProfileData((prev) => ({
            ...prev,
            name: u.fullName || u.name || prev.name,
            joinedDate: joinString,
            hostedCount,
            attendedCount: registrationsCount,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId) || AVATAR_OPTIONS[0];

  return (
    <>
      <Navbar forceDarkTop />
      <main className="min-h-screen bg-[#0d0d0e] text-white pt-24 sm:pt-32 pb-36">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* ================================================================= */}
          {/* PROFILE HEADER (Screenshot 1) */}
          {/* ================================================================= */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Avatar Circle */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-white/20 bg-white/5 shadow-2xl shrink-0">
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
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white truncate">
                  {profileData.name}
                </h1>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  title="Settings & Profile Edit"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              </div>

              {/* Joined Date */}
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Calendar className="w-3.5 h-3.5 text-white/40" />
                <span>{profileData.joinedDate}</span>
              </div>

              {/* Stats: Hosted & Attended */}
              <div className="flex items-center gap-4 text-xs pt-0.5">
                <div>
                  <span className="font-bold text-white text-sm mr-1">{profileData.hostedCount}</span>
                  <span className="text-white/50">Hosted</span>
                </div>
                <div>
                  <span className="font-bold text-white text-sm mr-1">{profileData.attendedCount}</span>
                  <span className="text-white/50">Attended</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-2.5 pt-1 text-white/60">
                {profileData.socials?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${profileData.socials.linkedin.replace(/^.*linkedin\.com\/in\//, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:text-white transition-colors"
                    title="LinkedIn"
                  >
                    <LinkedInIcon className="w-4 h-4" />
                  </a>
                )}
                {profileData.socials?.x && (
                  <a
                    href={`https://x.com/${profileData.socials.x.replace(/^.*x\.com\//, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:text-white transition-colors"
                    title="X"
                  >
                    <XIcon className="w-4 h-4" />
                  </a>
                )}
                {profileData.socials?.instagram && (
                  <a
                    href={`https://instagram.com/${profileData.socials.instagram.replace(/^.*instagram\.com\//, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:text-white transition-colors"
                    title="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                )}
                {profileData.socials?.website && (
                  <a
                    href={profileData.socials.website.startsWith("http") ? profileData.socials.website : `https://${profileData.socials.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:text-white transition-colors"
                    title="Personal Website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bio text if present */}
          {profileData.bio && (
            <p className="mt-4 text-xs text-white/70 leading-relaxed max-w-xl">
              {profileData.bio}
            </p>
          )}

          {/* Subtle Horizontal Divider Line */}
          <div className="border-t border-white/10 my-10" />

          {/* Tabs for Hosted vs Attended */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 sm:mb-12 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab("events")}
              className={`relative pb-2 font-semibold transition-colors cursor-pointer ${
                activeTab === "events" ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              <span>Hosted Events ({profileData.hostedCount})</span>
              {activeTab === "events" && (
                <motion.div
                  layoutId="profileTabLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab("attended")}
              className={`relative pb-2 font-semibold transition-colors cursor-pointer ${
                activeTab === "attended" ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              <span>Attended ({profileData.attendedCount})</span>
              {activeTab === "attended" && (
                <motion.div
                  layoutId="profileTabLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                />
              )}
            </button>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: HOSTED EVENTS (Empty State matching Screenshot 1) */}
          {/* ================================================================= */}
          {activeTab === "events" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center"
            >
              {/* Luma-style Calendar-0 Empty State Illustration */}
              <CalendarEmptyIllustration />

              <h2 className="text-base sm:text-lg font-bold text-white/90 mt-6 mb-1">
                Nothing Here, Yet
              </h2>
              <p className="text-xs sm:text-sm text-white/50 max-w-sm">
                {profileData.name} has no public events at this time.
              </p>

              <div className="mt-6">
                <Link
                  href="/host"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Host an Event</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: ATTENDED EVENTS & REGISTRATIONS */}
          {/* ================================================================= */}
          {activeTab === "attended" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {user?.registrations && user.registrations.length > 0 ? (
                user.registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-2xl bg-[#141416] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {reg.event?.title || "Campus Event"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80">
                          {reg.status || "CONFIRMED"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-white/40" />
                          {reg.event?.startsAt
                            ? new Date(reg.event.startsAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "Upcoming"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-white/40" />
                          {reg.event?.venueName || "Main Campus Hall"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/events/${reg.eventId || ""}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition-colors self-start sm:self-auto"
                    >
                      <Ticket className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Ticket</span>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  {/* Demo Attended Event Items to show rich attended logs */}
                  {[
                    {
                      title: "Google Developer Student Fest 2025",
                      date: "Sep 24, 2025",
                      venue: "Innovation Hub, Bengaluru",
                      tier: "General Admission",
                    },
                    {
                      title: "Next.js & Full-Stack AI Workshop",
                      date: "Aug 15, 2025",
                      venue: "Virtual Campus Hall",
                      tier: "VIP Attendee",
                    },
                    {
                      title: "Campus Web3 & Solana Summit",
                      date: "Jul 08, 2025",
                      venue: "Tech Auditorium",
                      tier: "Early Bird Pass",
                    },
                  ].map((event, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#141416] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{event.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            Verified Attendee
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-white/40" />
                            {event.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-white/40" />
                            {event.venue}
                          </span>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-xs font-semibold text-white/70">
                        <Ticket className="w-3.5 h-3.5 text-amber-400" />
                        <span>{event.tier}</span>
                      </div>
                    </div>
                  ))}
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
// High-Fidelity Calendar-0 Illustration matching Screenshot 1
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
        className="text-[#2b2b2f]"
      >
        {/* Calendar Body */}
        <rect
          x="12"
          y="18"
          width="82"
          height="82"
          rx="18"
          fill="#1c1c1f"
          stroke="#323238"
          strokeWidth="3.5"
        />

        {/* Top binder bar line */}
        <rect x="20" y="27" width="54" height="8" rx="4" fill="#2a2a30" />

        {/* Calendar Event Grid blocks */}
        <rect x="20" y="44" width="18" height="12" rx="3" fill="#2a2a30" />
        <rect x="42" y="44" width="18" height="20" rx="3" fill="#32323a" />
        <rect x="20" y="60" width="18" height="22" rx="3" fill="#2a2a30" />
        <rect x="42" y="68" width="18" height="8" rx="3" fill="#26262c" />
        <rect x="64" y="56" width="16" height="18" rx="3" fill="#2a2a30" />

        {/* Floating Notification Badge with "0" */}
        <g filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))">
          <circle
            cx="84"
            cy="20"
            r="16"
            fill="#27272c"
            stroke="#3a3a42"
            strokeWidth="3"
          />
          <text
            x="84"
            y="25"
            textAnchor="middle"
            fill="#71717a"
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
