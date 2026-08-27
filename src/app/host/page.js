"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AgentWidget from "@/components/ui/AgentWidget";
import Link from "next/link";
import Image from "next/image";
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Ticket, 
  CheckCircle2, 
  Users, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Zap, 
  Check, 
  Plus,
  Share2,
  Award,
  Sliders,
  DollarSign
} from "lucide-react";

const CATEGORIES = [
  "Tech & Hackathons",
  "Cultural & Music Fests",
  "Workshops & Seminars",
  "Sports & Gaming",
  "Startups & Networking",
  "Clubs & Socials",
];

const HOST_FEATURES = [
  {
    icon: <QrCode className="w-6 h-6 text-orange-500" />,
    title: "Signed digital passes",
    desc: "Attendee passes are HMAC-signed on the server so a copied ID is not enough to fake a ticket.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
    title: "Verified Organizer Badge",
    desc: "Instant credibility for your club with our verified campus host trust seal.",
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    title: "Real time Telemetry",
    desc: "Track live attendance, peak arrival times, and instant headcount analytics.",
  },
  {
    icon: <Ticket className="w-6 h-6 text-purple-500" />,
    title: "Zero Friction Ticketing",
    desc: "Signed digital passes issued to the attendee account. Email/SMS/wallet delivery is not enabled in this version.",
  },
];

export default function HostPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublished, setIsPublished] = useState(false);

  // Form State
  const [eventData, setEventData] = useState({
    title: "AI & LLM Campus Hackathon 2026",
    category: "Tech & Hackathons",
    org: "Developer Society UIC",
    date: "2026-09-15",
    time: "10:00 AM",
    location: "Main Auditorium, Block C",
    ticketType: "Free",
    price: "0",
    capacity: "250",
    enableQr: true,
  });

  // Calculator State
  const [estAttendees, setEstAttendees] = useState(300);
  const [estPrice, setEstPrice] = useState(10);

  const handleNextStep = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const [publishError, setPublishError] = useState("");
  const [publishBusy, setPublishBusy] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishError("");
    setPublishBusy(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventData.title,
          type: eventData.category,
          category: eventData.category,
          date: `${eventData.date}T10:00:00`,
          location: eventData.location,
          description: `Hosted by ${eventData.org}`,
          ticketType: eventData.ticketType,
          price: eventData.price,
          capacity: eventData.capacity,
        }),
      });
      const payload = await res.json();
      if (res.status === 401) {
        window.location.href = "/login?redirectTo=/host";
        return;
      }
      if (res.status === 403) {
        const apply = await fetch("/api/host/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationName: eventData.org || "Campus organization",
            organizationType: "College Club",
            notes: `Event draft: ${eventData.title}`,
          }),
        });
        const applyPayload = await apply.json();
        setPublishError(
          apply.ok
            ? "You need host verification before publishing. Your application is pending review."
            : applyPayload.error?.message || "Only verified organisers can publish events."
        );
        return;
      }
      if (!res.ok) {
        setPublishError(payload.error?.message || "Could not publish event");
        return;
      }
      setIsPublished(true);
    } finally {
      setPublishBusy(false);
    }
  };

  // Calculations
  const checkInTimeMins = Math.ceil(estAttendees / 100);
  const grossEstRevenue = estAttendees * estPrice;

  return (
    <>
      <Navbar forceDarkTop={true} />
      <AgentWidget />

      <main className="min-h-screen bg-primary transition-colors duration-300 pt-28 pb-24 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-tight mb-6"
            >
              Launch Your Campus Event in <span className="gradient-text">Under 3 Minutes</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-base sm:text-lg leading-relaxed"
            >
              From hackathons and tech talks to cultural fests and sports leagues — get zero noise ticketing, instant QR check in, and verified host telemetry.
            </motion.p>
            <Link
              href="/host/apply"
              className="inline-flex mt-6 px-5 py-2.5 rounded-full text-xs font-bold border border-border-subtle text-text-primary hover:border-[var(--accent-orange)]"
            >
              Apply for host verification first →
            </Link>
          </div>

          {/* Step-by-Step Event Builder Form Container */}
          <div id="event-builder" className="mb-28 bg-card border border-border-subtle rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            
            {isPublished ? (
              /* Published Success View */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center text-center max-w-xl mx-auto space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-orange)]">
                    EVENT IS LIVE!
                  </span>
                  <h2 className="text-3xl font-extrabold text-text-primary mt-1">
                    {eventData.title}
                  </h2>
                  <p className="text-xs text-text-secondary mt-2">
                    Hosted by {eventData.org} • {eventData.category}
                  </p>
                </div>

                {/* Shareable Event Box */}
                <div className="w-full bg-background border border-border-subtle rounded-2xl p-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-text-secondary truncate">
                    https://uncooked.portal/e/{eventData.title.toLowerCase().replace(/\s+/g, '-')}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(`https://uncooked.portal/e/${eventData.title}`)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--accent-orange)] text-white text-xs font-bold shrink-0 hover:opacity-90 transition-opacity"
                  >
                    Copy Link
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
                  <Link
                    href="/dashboard"
                    className="flex-1 py-3.5 rounded-xl font-bold text-xs bg-white text-zinc-900 hover:bg-zinc-100 transition-colors shadow-md text-center"
                  >
                    View in Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsPublished(false);
                      setCurrentStep(1);
                    }}
                    className="flex-1 py-3.5 rounded-xl font-semibold text-xs bg-card border border-border-subtle text-text-primary hover:bg-border-subtle transition-colors"
                  >
                    Create Another Event
                  </button>
                </div>
              </motion.div>
            ) : (
              <div>
                {/* Form Progress Indicator Header */}
                <div className="flex items-center justify-between mb-8 border-b border-border-subtle/60 pb-6">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Event Setup Wizard
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Step {currentStep} of 4 — {
                        currentStep === 1 ? "Event Essentials" :
                        currentStep === 2 ? "Schedule & Venue" :
                        currentStep === 3 ? "Access & Telemetry" : "Preview & Launch"
                      }
                    </p>
                  </div>

                  {/* Step Pills */}
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((stepNum) => (
                      <div
                        key={stepNum}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          currentStep === stepNum
                            ? "bg-[var(--accent-orange)] text-white shadow-md scale-110"
                            : currentStep > stepNum
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-background text-text-secondary border border-border-subtle"
                        }`}
                      >
                        {currentStep > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Step Body */}
                <form onSubmit={handlePublish}>
                  {publishError && <p className="text-xs text-red-400 mb-4">{publishError}</p>}
                  <AnimatePresence mode="wait">
                    {/* Step 1: Event Essentials */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                            Event Title
                          </label>
                          <input
                            type="text"
                            value={eventData.title}
                            onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                            className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                            placeholder="e.g. AI & LLM Campus Hackathon 2026"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                              Category
                            </label>
                            <select
                              value={eventData.category}
                              onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors cursor-pointer"
                            >
                              {CATEGORIES.map((cat, idx) => (
                                <option key={idx} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                              Hosting Organization / Club
                            </label>
                            <input
                              type="text"
                              value={eventData.org}
                              onChange={(e) => setEventData({ ...eventData, org: e.target.value })}
                              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                              placeholder="e.g. Developer Society UIC"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Schedule & Venue */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                              Event Date
                            </label>
                            <input
                              type="date"
                              value={eventData.date}
                              onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                              Start Time
                            </label>
                            <input
                              type="text"
                              value={eventData.time}
                              onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                              placeholder="10:00 AM"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                            Venue / Campus Location
                          </label>
                          <input
                            type="text"
                            value={eventData.location}
                            onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                            className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                            placeholder="e.g. Main Auditorium, Block C"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Access & Telemetry */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                              Ticket Access Type
                            </label>
                            <select
                              value={eventData.ticketType}
                              onChange={(e) => setEventData({ ...eventData, ticketType: e.target.value })}
                              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors cursor-pointer"
                            >
                              <option value="Free">Free Ticket / Open RSVP</option>
                              <option value="Paid">Paid Entry Pass</option>
                              <option value="Approval">Approval Required</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                              Attendee Capacity Limit
                            </label>
                            <input
                              type="number"
                              value={eventData.capacity}
                              onChange={(e) => setEventData({ ...eventData, capacity: e.target.value })}
                              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                              placeholder="250"
                            />
                          </div>
                        </div>

                        {/* Telemetry Toggle Box */}
                        <div className="p-5 rounded-2xl bg-background border border-border-subtle flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-orange-500/10 text-[var(--accent-orange)]">
                              <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-text-primary">
                                Enable Offline QR Check in Telemetry
                              </h4>
                              <p className="text-xs text-text-secondary">
                                Generates unique pass signatures & instant scanner app syncing.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEventData({ ...eventData, enableQr: !eventData.enableQr })}
                            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                              eventData.enableQr ? "bg-[var(--accent-orange)]" : "bg-zinc-700"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              eventData.enableQr ? "translate-x-6" : "translate-x-0"
                            }`} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Live Event Card Preview & Launch */}
                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
                            Live Portal Card Preview
                          </h4>
                          
                          {/* Live Rendered Card Preview */}
                          <div className="max-w-md mx-auto p-6 rounded-3xl bg-background border border-border-subtle shadow-2xl relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-orange-500/10 text-[var(--accent-orange)] border border-orange-500/20">
                                {eventData.category}
                              </span>
                              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                {eventData.ticketType === "Free" ? "Free Entry" : `$${eventData.price} Ticket`}
                              </span>
                            </div>

                            <h3 className="text-xl font-bold text-text-primary leading-snug mb-2">
                              {eventData.title || "Untitled Event"}
                            </h3>

                            <p className="text-xs text-text-secondary mb-4">
                              Hosted by <span className="text-text-primary font-semibold">{eventData.org || "Club"}</span>
                            </p>

                            <div className="space-y-2 text-xs text-text-secondary pt-2 border-t border-border-subtle/60">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                                <span>{eventData.date} at {eventData.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                                <span>{eventData.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                                <span>Cap: {eventData.capacity} attendees</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form Action Controls */}
                  <div className="flex items-center justify-between pt-8 mt-8 border-t border-border-subtle/60">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-text-secondary bg-background border border-border-subtle hover:text-text-primary transition-colors"
                      >
                        Back
                      </button>
                    ) : <div />}

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--accent-orange)] hover:opacity-90 transition-all shadow-md flex items-center gap-2"
                      >
                        Next Step
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-8 py-3 rounded-xl text-xs font-extrabold text-white shadow-xl transition-all hover:scale-105"
                        style={{
                          background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
                          boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.4)",
                        }}
                      >
                        🚀 Publish Live Event Now
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* Interactive Telemetry & Capacity Estimator */}
          <div className="mb-28 bg-card/60 border border-border-subtle rounded-3xl p-8 sm:p-12">
            <div className="max-w-2xl mb-8">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent-orange)] mb-2">
                TELEMETRY CALCULATOR
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Estimate Check in Speed & Capacity Throughput
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold text-text-secondary mb-2">
                    <span>EXPECTED ATTENDEES</span>
                    <span className="text-[var(--accent-orange)]">{estAttendees} Students</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={estAttendees}
                    onChange={(e) => setEstAttendees(Number(e.target.value))}
                    className="w-full accent-[var(--accent-orange)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-text-secondary mb-2">
                    <span>TICKET PRICE</span>
                    <span className="text-[var(--accent-orange)]">${estPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={estPrice}
                    onChange={(e) => setEstPrice(Number(e.target.value))}
                    className="w-full accent-[var(--accent-orange)] cursor-pointer"
                  />
                </div>
              </div>

              {/* Calculator Output Display Box */}
              <div className="lg:col-span-5 bg-background border border-border-subtle rounded-2xl p-6 flex flex-col space-y-4 shadow-xl">
                <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
                  <span className="text-xs text-text-secondary">Estimated Gate Clearance Time</span>
                  <span className="text-sm font-bold text-emerald-400">~{checkInTimeMins} mins</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
                  <span className="text-xs text-text-secondary">Scan Speed Throughput</span>
                  <span className="text-sm font-bold text-text-primary">100 Scans / Min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-secondary">Est. Gross Revenue</span>
                  <span className="text-lg font-extrabold text-[var(--accent-orange)]">${grossEstRevenue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Host Features Grid */}
          <div className="mb-24">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent-orange)] mb-3">
                WHY HOST ON UNCOOKED
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Built specifically for campus logistics
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOST_FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border-subtle rounded-2xl p-6 flex flex-col hover:border-[var(--accent-orange)] transition-all group"
                >
                  <div className="p-3 rounded-xl bg-background w-fit mb-5 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h4 className="text-base font-bold text-text-primary mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
