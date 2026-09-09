"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/components/providers/SupabaseProvider";
import {
  MapPin,
  Ticket,
  Users,
  Shuffle,
  ImageIcon,
  Globe,
  ChevronDown,
  Lock,
  FileText,
  X,
  Loader2,
  Check,
  Edit2,
  Calendar as CalendarIcon,
  ShieldCheck,
  CheckCircle2,
  Mail,
} from "lucide-react";

const LightRays = dynamic(() => import("@/components/ui/LightRays"), {
  ssr: false,
  loading: () => null,
});

function LinkedInIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.96 0-1.74.78-1.74 1.74s.78 1.74 1.74 1.74 1.74-.78 1.74-1.74-.78-1.74-1.74-1.74Z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TwitterIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export const EVENT_THEMES = [
  {
    id: "cosmic",
    name: "Cosmic Noir",
    poster: "/events/out-of-this-world.jpg",
    bg: "#190d1e",
    glow: "rgba(217, 70, 239, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.09)",
    accentColor: "#d946ef",
    swatch: "linear-gradient(135deg, #190d1e, #701a75)",
  },
  {
    id: "ruby",
    name: "Disco Ruby",
    poster: "/events/disco-lips.jpg",
    bg: "#17050a",
    glow: "rgba(244, 63, 94, 0.15)",
    cardBg: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(244, 63, 94, 0.2)",
    accentColor: "#f43f5e",
    swatch: "linear-gradient(135deg, #1f060d, #881337)",
  },
  {
    id: "minimal",
    name: "Classic Editorial",
    poster: "/events/you-are-invited-minimal.jpg",
    bg: "#121214",
    glow: "rgba(255, 255, 255, 0.08)",
    cardBg: "rgba(255, 255, 255, 0.035)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    accentColor: "#ffffff",
    swatch: "linear-gradient(135deg, #121214, #27272a)",
  },
  {
    id: "blush",
    name: "Blush Aura",
    poster: "/events/word-search-pink.jpg",
    bg: "#200d17",
    glow: "rgba(251, 113, 133, 0.15)",
    cardBg: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(251, 113, 133, 0.2)",
    accentColor: "#fb7185",
    swatch: "linear-gradient(135deg, #240e1a, #9f1239)",
  },
  {
    id: "apollo",
    name: "Apollo Amber",
    poster: "/events/guest-list-astronaut.jpg",
    bg: "#141009",
    glow: "rgba(245, 158, 11, 0.15)",
    cardBg: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(245, 158, 11, 0.2)",
    accentColor: "#f59e0b",
    swatch: "linear-gradient(135deg, #1a140a, #78350f)",
  },
  {
    id: "festival",
    name: "Electric Festival",
    poster: "/events/party-tie-dye.jpg",
    bg: "#160824",
    glow: "rgba(168, 85, 247, 0.18)",
    cardBg: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(168, 85, 247, 0.2)",
    accentColor: "#c084fc",
    swatch: "linear-gradient(135deg, #1d0933, #6b21a8)",
  },
];

const CATEGORIES = [
  "Tech & Hackathons",
  "Cultural & Music Fests",
  "Workshops & Seminars",
  "Sports & Gaming",
  "Startups & Networking",
  "Clubs & Socials",
];

export default function CreateEventView({ isModal = false, onClose }) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Active theme & poster (both stay in sync!)
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const currentTheme = EVENT_THEMES[activeThemeIndex % EVENT_THEMES.length];
  const [customPosterUrl, setCustomPosterUrl] = useState("");
  const [showPosterModal, setShowPosterModal] = useState(false);

  // Host Verification States
  const [isHostVerified, setIsHostVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyGmail, setVerifyGmail] = useState("");
  const [verifyLinkedin, setVerifyLinkedin] = useState("");
  const [verifyInstagram, setVerifyInstagram] = useState("");
  const [verifyTwitter, setVerifyTwitter] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

  // Single dropdown coordinator to prevent ANY overlapping
  // Allowed values: null | 'theme' | 'calendar' | 'visibility' | 'category'
  const [openDropdown, setOpenDropdown] = useState(null);
  const containerRef = useRef(null);

  // Check host verification status on mount & auth state change
  useEffect(() => {
    let isSubscribed = true;

    const checkHostStatus = async () => {
      try {
        const res = await fetch("/api/host/verify");
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data;
        if (isSubscribed && data) {
          if (data.verified) {
            setIsHostVerified(true);
          }
          if (data.userEmail) {
            setVerifyGmail((prev) => prev || data.userEmail);
          }
          if (data.application?.notes) {
            try {
              const notes = JSON.parse(data.application.notes);
              if (notes.gmail) setVerifyGmail(notes.gmail);
              if (notes.linkedin) setVerifyLinkedin(notes.linkedin);
              if (notes.instagram) setVerifyInstagram(notes.instagram);
              if (notes.twitter) setVerifyTwitter(notes.twitter);
            } catch {
              // notes not in json format, proceed
            }
          }
        }
      } catch {
        // silent fail
      }
    };

    checkHostStatus();
    return () => {
      isSubscribed = false;
    };
  }, [authStatus]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  // Form State
  const [title, setTitle] = useState("");
  const [calendar, setCalendar] = useState("Personal Calendar");
  const [visibility, setVisibility] = useState("Public");
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Date & Time
  const defaultDates = useMemo(() => {
    const s = new Date();
    s.setDate(s.getDate() + 7);
    s.setHours(20, 30, 0, 0);
    const e = new Date(s);
    e.setHours(21, 30, 0, 0);

    const formatDay = (d) =>
      d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const formatTime = (d) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    return {
      startDateStr: formatDay(s),
      startTimeStr: formatTime(s),
      endDateStr: formatDay(e),
      endTimeStr: formatTime(e),
      rawStart: s.toISOString().slice(0, 16),
      rawEnd: e.toISOString().slice(0, 16),
    };
  }, []);

  const [rawStart, setRawStart] = useState(defaultDates.rawStart);
  const [rawEnd, setRawEnd] = useState(defaultDates.rawEnd);
  const [startDateFormatted, setStartDateFormatted] = useState(defaultDates.startDateStr);
  const [startTimeFormatted, setStartTimeFormatted] = useState(defaultDates.startTimeStr);
  const [endDateFormatted, setEndDateFormatted] = useState(defaultDates.endDateStr);
  const [endTimeFormatted, setEndTimeFormatted] = useState(defaultDates.endTimeStr);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Location & Description
  const [location, setLocation] = useState("");
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [description, setDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Event Options
  const [ticketType, setTicketType] = useState("Free"); // "Free" or "Paid"
  const [priceInr, setPriceInr] = useState("499");
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [unlimitedCapacity, setUnlimitedCapacity] = useState(true);
  const [capacity, setCapacity] = useState("100");
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);

  // Form submission state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activePoster = customPosterUrl || currentTheme.poster;

  // Shuffle action: cycles through the 6 themes & posters together
  const handleShuffle = () => {
    const nextIdx = (activeThemeIndex + 1) % EVENT_THEMES.length;
    setActiveThemeIndex(nextIdx);
    setCustomPosterUrl("");
  };

  const selectTheme = (index) => {
    setActiveThemeIndex(index);
    setCustomPosterUrl("");
    setOpenDropdown(null);
  };

  const handleStartChange = (val) => {
    setRawStart(val);
    if (!val) return;
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      setStartDateFormatted(
        d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      );
      setStartTimeFormatted(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    }
  };

  const handleEndChange = (val) => {
    setRawEnd(val);
    if (!val) return;
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      setEndDateFormatted(
        d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      );
      setEndTimeFormatted(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    }
  };

  // Host Verification Submission
  const handleVerifySubmit = async (e) => {
    if (e) e.preventDefault();
    setVerifyError("");
    setVerifySuccess("");

    const cleanGmail = verifyGmail.trim().toLowerCase();
    const cleanLinkedin = verifyLinkedin.trim();

    if (!cleanGmail) {
      setVerifyError("Gmail address is mandatory.");
      return;
    }
    if (!cleanGmail.endsWith("@gmail.com") && !cleanGmail.endsWith("@googlemail.com")) {
      setVerifyError("A valid Gmail address (@gmail.com) is mandatory.");
      return;
    }
    if (!cleanLinkedin || cleanLinkedin.length < 3) {
      setVerifyError("LinkedIn profile is mandatory.");
      return;
    }

    setVerifyBusy(true);

    try {
      const res = await fetch("/api/host/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmail: cleanGmail,
          linkedin: cleanLinkedin,
          instagram: verifyInstagram.trim(),
          twitter: verifyTwitter.trim(),
        }),
      });

      const payload = await res.json();

      if (res.status === 401) {
        setVerifyError("Please log in first to verify as a host.");
        setVerifyBusy(false);
        return;
      }

      if (!res.ok) {
        setVerifyError(payload.error?.message || "Verification submission failed. Please try again.");
        setVerifyBusy(false);
        return;
      }

      setIsHostVerified(true);
      setVerifySuccess("Host identity verified! You are now authorized to publish events.");
      setError("");

      setTimeout(() => {
        setShowVerifyModal(false);
        setVerifySuccess("");
      }, 1500);
    } catch {
      setVerifyError("Network error while submitting verification. Please check your connection.");
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (!title.trim()) {
        setError("Please enter an event name.");
        setBusy(false);
        return;
      }

      const startDate = new Date(rawStart);
      const endDate = rawEnd ? new Date(rawEnd) : null;
      if (Number.isNaN(startDate.getTime())) {
        setError("Valid start date & time is required.");
        setBusy(false);
        return;
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          type: category,
          date: startDate.toISOString(),
          endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate.toISOString() : null,
          location: location.trim() || "Virtual / Campus Hall",
          description: description.trim() || `${title.trim()} on Opportia.`,
          ticketType,
          price: ticketType === "Paid" ? parseFloat(priceInr) || 0 : 0,
          capacity: unlimitedCapacity ? 20000 : parseInt(capacity, 10) || 100,
          unlimitedCapacity,
          waitlistEnabled: requireApproval,
          bannerUrl: activePoster,
        }),
      });

      const payload = await res.json();

      if (res.status === 401) {
        router.push("/login?redirectTo=/create");
        return;
      }
      if (res.status === 403) {
        setError("Only verified organisers can publish live events. Please verify your host credentials above.");
        return;
      }
      if (!res.ok) {
        setError(payload.error?.message || "Could not create event.");
        return;
      }

      setSuccessMsg("Event created successfully! Redirecting...");
      const id = payload.data?.event?.id;
      if (id) {
        setTimeout(() => {
          if (onClose) onClose();
          router.push(`/events/${encodeURIComponent(id)}`);
        }, 800);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-center pt-20 sm:pt-16 pb-16 px-4 sm:px-8 lg:px-12 overflow-x-hidden transition-colors duration-700 select-text"
      style={{
        backgroundColor: currentTheme.bg,
      }}
    >
      {/* Background Dynamic Ambient Radial Glow */}
      <div
        className="pointer-events-none fixed inset-0 transition-all duration-700 z-0"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${currentTheme.glow} 0%, transparent 70%)`,
        }}
      />

      {/* LightRays WebGL shader animation */}
      <LightRays
        raysOrigin="top-center"
        raysColor={currentTheme.accentColor || "#ffffff"}
        raysSpeed={1.2}
        lightSpread={0.8}
        rayLength={1.8}
        pulsating={true}
        noiseAmount={0.05}
        distortion={0.08}
        followMouse={false}
        mouseInfluence={0.0}
        className="opacity-45"
      />

      {/* Top-Right Stationary Dismiss Cross (✕) Button: strictly right-aligned, pinned at top-right of screen */}
      {!isModal && (
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            else router.push("/");
          }}
          className="fixed top-4 right-4 sm:top-6 sm:right-8 z-[1050] w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-xl cursor-pointer shadow-2xl flex items-center justify-center transition-colors"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Main Content Container (Pure Event Creation Interface with No Navbar) */}
      <main className="relative z-10 w-full max-w-[1050px] my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Event Poster & Theme Picker */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            {/* 1:1 Poster Image Container */}
            <div className="relative w-full aspect-square max-w-[420px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black/40 group">
              <Image
                src={activePoster}
                alt={currentTheme.name}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105"
                priority
              />

              {/* Subtle bottom shadow vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />

              {/* Change Poster Button */}
              <button
                type="button"
                onClick={() => setShowPosterModal(true)}
                className="absolute bottom-4 right-4 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                title="Choose from all event posters"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Theme Selector Bar */}
            <div className="w-full max-w-[420px] bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2.5 flex items-center justify-between shadow-lg backdrop-blur-sm relative">
              {/* Theme Dropdown trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("theme")}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-inner shrink-0"
                    style={{ background: currentTheme.swatch }}
                  />
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-white/40 block leading-tight">
                      Theme
                    </span>
                    <span className="text-xs font-semibold text-white/90 flex items-center gap-1">
                      {currentTheme.name}
                      <ChevronDown className="w-3 h-3 text-white/50" />
                    </span>
                  </div>
                </button>

                {/* Theme Selector Popover */}
                <AnimatePresence>
                  {openDropdown === "theme" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute left-0 bottom-full mb-2 w-52 bg-[#18111d] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-40 backdrop-blur-xl"
                    >
                      {EVENT_THEMES.map((t, idx) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => selectTheme(idx)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                            currentTheme.id === t.id
                              ? "bg-white/10 text-white font-bold"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                            style={{ background: t.swatch }}
                          />
                          <span>{t.name}</span>
                          {currentTheme.id === t.id && (
                            <Check className="w-3.5 h-3.5 ml-auto text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shuffle Button: updates both poster and page theme */}
              <button
                type="button"
                onClick={handleShuffle}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all active:rotate-180 cursor-pointer"
                title="Shuffle theme & image"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Event Details Form */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Top Row Dropdown & Action Pills */}
            <div className="flex items-center gap-2.5 flex-wrap relative z-30">
              
              {/* 1. Calendar Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("calendar")}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>{calendar}</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>

                <AnimatePresence>
                  {openDropdown === "calendar" && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute left-0 top-full mt-1.5 w-48 bg-[#18111d] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-40 backdrop-blur-xl"
                    >
                      {["Personal Calendar", "Campus Club", "Tech Society", "Ecosystem Leads"].map(
                        (cal) => (
                          <button
                            key={cal}
                            type="button"
                            onClick={() => {
                              setCalendar(cal);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                              calendar === cal
                                ? "bg-white/10 text-white font-bold"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {cal}
                          </button>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Visibility Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("visibility")}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-white/50" />
                  <span>{visibility}</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>

                <AnimatePresence>
                  {openDropdown === "visibility" && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute left-0 top-full mt-1.5 w-48 bg-[#18111d] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-40 backdrop-blur-xl"
                    >
                      {["Public", "Private (Invite Only)", "Unlisted"].map((vis) => (
                        <button
                          key={vis}
                          type="button"
                          onClick={() => {
                            setVisibility(vis);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                            visibility === vis
                              ? "bg-white/10 text-white font-bold"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {vis}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Category Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("category")}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-amber-400/90 transition-colors cursor-pointer"
                >
                  <span>{category}</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>

                <AnimatePresence>
                  {openDropdown === "category" && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute left-0 top-full mt-1.5 w-56 bg-[#18111d] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-40 backdrop-blur-xl"
                    >
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                            category === cat
                              ? "bg-white/10 text-white font-bold"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. Host Verification Action Button */}
              {isHostVerified ? (
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition-all cursor-pointer shadow-sm"
                  title="View verified host credentials"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Host Verified</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-200 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 group"
                  title="Verify host credentials to host & publish"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Verify Host</span>
                </button>
              )}
            </div>

            {/* Event Name Input (Luma Style Big Typography) */}
            <div className="pt-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event Name"
                className="w-full bg-transparent text-2xl sm:text-3xl md:text-4xl font-extrabold text-white placeholder:text-white/25 focus:outline-none tracking-tight border-none p-0 selection:bg-pink-500/30"
                maxLength={140}
                required
              />
            </div>

            {/* Date & Time Card */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Dates display */}
                <div className="space-y-2 text-xs sm:text-sm font-medium">
                  {/* Start Row */}
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-white/50 w-10 sm:w-12">Start</span>
                    <span className="text-white font-semibold">{startDateFormatted}</span>
                    <span className="text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-mono text-xs">
                      {startTimeFormatted}
                    </span>
                  </div>

                  {/* End Row */}
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    <span className="w-2 h-2 rounded-full border border-white/40 shrink-0" />
                    <span className="text-white/50 w-10 sm:w-12">End</span>
                    <span className="text-white font-semibold">{endDateFormatted}</span>
                    <span className="text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-mono text-xs">
                      {endTimeFormatted}
                    </span>
                  </div>
                </div>

                {/* Right side: Timezone & Edit toggle */}
                <div className="flex items-center gap-3 md:border-l md:border-white/10 md:pl-5">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Globe className="w-4 h-4 text-white/40 shrink-0" />
                    <div>
                      <div className="text-white/90 font-medium">GMT+05:30</div>
                      <div className="text-[10px] text-white/40">Kolkata / India</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title="Edit dates"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Collapsible Date Picker inputs */}
              {showDatePicker && (
                <div className="pt-3 border-t border-white/10 grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={rawStart}
                      onChange={(e) => handleStartChange(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={rawEnd}
                      onChange={(e) => handleEndChange(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location Card */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 backdrop-blur-sm shadow-xl transition-colors hover:border-white/15">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setIsEditingLocation(true)}
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white/90 flex items-center justify-between">
                    <span>{location || "Add Event Location"}</span>
                    {!isEditingLocation && (
                      <span className="text-[11px] text-white/40 hover:text-white">Edit</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40">
                    Offline location or virtual meeting link
                  </p>
                </div>
              </div>

              {isEditingLocation && (
                <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Campus Innovation Center, Lucknow or Google Meet URL"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 backdrop-blur-sm shadow-xl transition-colors hover:border-white/15">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setIsEditingDescription(true)}
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white/90 flex items-center justify-between">
                    <span>{description ? "Event Description" : "Add Description"}</span>
                    {!isEditingDescription && (
                      <span className="text-[11px] text-white/40 hover:text-white">Edit</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 line-clamp-1">
                    {description || "What happens, who it is for, agenda, and guidelines..."}
                  </p>
                </div>
              </div>

              {isEditingDescription && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide event details, schedule, prerequisites, and speaker info..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 resize-y"
                    autoFocus
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingDescription(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Event Options Header & Box */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2.5 px-1">
                Event Options
              </h4>

              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl divide-y divide-white/[0.08] backdrop-blur-sm shadow-xl overflow-hidden">
                
                {/* 1. Ticket Price */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-4 h-4 text-white/60" />
                    <div>
                      <div className="text-xs font-semibold text-white">Ticket Price</div>
                      <div className="text-[10px] text-white/40">Free RSVP or paid admission (INR)</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditingPrice ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={ticketType}
                          onChange={(e) => setTicketType(e.target.value)}
                          className="bg-[#1e1524] border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                        >
                          <option value="Free">Free</option>
                          <option value="Paid">Paid (INR)</option>
                        </select>
                        {ticketType === "Paid" && (
                          <div className="relative">
                            <span className="absolute left-2 top-1 text-xs text-white/50">₹</span>
                            <input
                              type="number"
                              value={priceInr}
                              onChange={(e) => setPriceInr(e.target.value)}
                              className="w-20 bg-white/10 border border-white/15 rounded-lg pl-5 pr-2 py-1 text-xs text-white"
                              min="1"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsEditingPrice(false)}
                          className="px-2 py-1 rounded-lg bg-white/10 text-xs text-white cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingPrice(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <span>{ticketType === "Free" ? "Free" : `₹${priceInr}`}</span>
                        <Edit2 className="w-3 h-3 text-white/40" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Require Approval */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-white/60" />
                    <div>
                      <div className="text-xs font-semibold text-white">Require Approval</div>
                      <div className="text-[10px] text-white/40">Host must approve guests before issuing passes</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRequireApproval(!requireApproval)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${
                      requireApproval ? "bg-white" : "bg-white/15"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full transition-transform ${
                        requireApproval ? "translate-x-5 bg-black" : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Capacity */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-white/60" />
                    <div>
                      <div className="text-xs font-semibold text-white">Capacity</div>
                      <div className="text-[10px] text-white/40">Maximum attendee pass limit</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditingCapacity ? (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-white/60 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unlimitedCapacity}
                            onChange={(e) => setUnlimitedCapacity(e.target.checked)}
                            className="rounded"
                          />
                          Unlimited
                        </label>
                        {!unlimitedCapacity && (
                          <input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            className="w-20 bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                            min="1"
                            max="20000"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setIsEditingCapacity(false)}
                          className="px-2 py-1 rounded-lg bg-white/10 text-xs text-white cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingCapacity(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <span>{unlimitedCapacity ? "Unlimited" : capacity}</span>
                        <Edit2 className="w-3 h-3 text-white/40" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-1.5">⚠️ {error}</span>
                {!isHostVerified && (
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(true)}
                    className="underline font-bold text-amber-300 hover:text-white cursor-pointer ml-auto"
                  >
                    Verify Host Now →
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Big Create Event Action Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="w-full py-4 rounded-full font-bold text-sm bg-white text-black hover:bg-zinc-200 transition-all duration-200 shadow-2xl active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Event…</span>
                  </>
                ) : (
                  <span>Create Event</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Poster Image Selection Modal showing all 6 themes & posters */}
      <AnimatePresence>
        {showPosterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1c1220] border border-white/15 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-pink-400" />
                    Choose Event Theme & Poster
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Selecting a poster automatically applies its matching aesthetic theme.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPosterModal(false)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 6 Curated Themes & Posters Grid */}
              <div className="grid grid-cols-3 gap-3">
                {EVENT_THEMES.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      selectTheme(i);
                      setShowPosterModal(false);
                    }}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${
                      activeThemeIndex === i
                        ? "border-pink-500 scale-95 shadow-xl ring-2 ring-pink-500/50"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <Image src={t.poster} alt={t.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-[10px] font-bold text-white truncate">{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Image URL Option */}
              <div className="pt-2 border-t border-white/10">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                  Or use custom image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customPosterUrl}
                    onChange={(e) => setCustomPosterUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPosterModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Host Verification Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#181020] border border-white/15 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 text-white relative max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-2 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>Host Verification</span>
                      {isHostVerified && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Verified
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Enter your account details to verify your identity and publish events.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Close verification modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status or Error Banner */}
              {verifyError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{verifyError}</span>
                </div>
              )}

              {verifySuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{verifySuccess}</span>
                </div>
              )}

              {/* Form Inputs */}
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                
                {/* 1. Gmail (Mandatory) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-red-400" />
                      <span>Gmail Address</span>
                    </label>
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                      Mandatory *
                    </span>
                  </div>
                  <input
                    type="email"
                    value={verifyGmail}
                    onChange={(e) => setVerifyGmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    className="w-full bg-white/5 border border-white/15 focus:border-amber-400/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-white/40">
                    Must be a valid Google / Gmail account (@gmail.com) for official verification.
                  </p>
                </div>

                {/* 2. LinkedIn (Mandatory) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                      <LinkedInIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span>LinkedIn Profile</span>
                    </label>
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                      Mandatory *
                    </span>
                  </div>
                  <input
                    type="text"
                    value={verifyLinkedin}
                    onChange={(e) => setVerifyLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile or username"
                    required
                    className="w-full bg-white/5 border border-white/15 focus:border-blue-400/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-white/40">
                    Required to verify professional or student organization identity.
                  </p>
                </div>

                {/* 3. Instagram (Optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                      <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                      <span>Instagram Account</span>
                    </label>
                    <span className="text-[10px] uppercase font-semibold text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <input
                    type="text"
                    value={verifyInstagram}
                    onChange={(e) => setVerifyInstagram(e.target.value)}
                    placeholder="@handle or https://instagram.com/handle"
                    className="w-full bg-white/5 border border-white/15 focus:border-pink-400/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
                  />
                </div>

                {/* 4. Twitter / X (Optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                      <TwitterIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Twitter / X Account</span>
                    </label>
                    <span className="text-[10px] uppercase font-semibold text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <input
                    type="text"
                    value={verifyTwitter}
                    onChange={(e) => setVerifyTwitter(e.target.value)}
                    placeholder="@handle or https://x.com/handle"
                    className="w-full bg-white/5 border border-white/15 focus:border-cyan-400/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyBusy}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {verifyBusy ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying…</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isHostVerified ? "Update Verification" : "Verify & Activate Host"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
