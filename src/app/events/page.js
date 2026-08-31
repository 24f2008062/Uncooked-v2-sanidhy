"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AgentWidget from "@/components/ui/AgentWidget";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, 
  Calendar, 
  MapPin, 
  Ticket, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  X, 
  Send,
  Filter,
  ArrowRight,
  QrCode,
  Clock,
  CheckSquare,
  Award
} from "lucide-react";

const EVENTS = [
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
    price: "$15 Ticket",
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

const COMPLETED_EVENTS = [
  {
    id: "mun-cms-lucknow",
    title: "MUN CMS Lucknow",
    category: "MUN",
    location: "Hussainganj",
    desc: "Station Road Campus MUN /// Diplomacy Unleashed. Organised by CMS Station Road Campus for Model United Nations delegates.",
    date: "08/12/2026",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop",
    recapText: "Over 450 student delegates from 28 colleges debated international security, environmental policy, and economic resolutions. 12 outstanding delegate awards presented.",
  },
  {
    id: "study-abroad-bootcamp",
    title: "Study Abroad Bootcamp",
    category: "SEMINAR",
    location: "Gomti Nagar",
    desc: "Your Roadmap to Global Education. Hosted by CMS Career Counselling Cell for higher studies guidance and visa workshops.",
    date: "02/08/2026",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop",
    recapText: "Comprehensive 1 day bootcamp covering GRE/TOEFL preparation, scholarship applications, and university portfolio reviews for 300+ aspiring postgraduate students.",
  },
  {
    id: "career-counselling-fest",
    title: "Career Counselling Festival",
    category: "MEETUP",
    location: "Chowk",
    desc: "A comprehensive career guidance festival designed to help students explore academic pathways, career opportunities, higher education...",
    date: "13/04/2026",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=600&auto=format&fit=crop",
    recapText: "Featured 15+ industry keynote speakers, resume drop booths, and 1 on 1 career counselling sessions for over 600 campus attendees.",
  },
];

const CATEGORIES = ["All", "Hackathons", "Cultural Fests", "Workshops", "Sports & Gaming", "Parties & Socials"];

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [activeRecapEvent, setActiveRecapEvent] = useState(null);
  const [bookingData, setBookingData] = useState({ name: "", email: "", qty: 1 });
  const [isBooked, setIsBooked] = useState(false);
  const [events, setEvents] = useState(EVENTS);
  const [bookingError, setBookingError] = useState("");
  const [ticketPass, setTicketPass] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((payload) => {
        const rows = payload.data?.events || payload.events || [];
        if (rows.length) {
          setEvents(
            rows.map((row) => ({
              id: row.id,
              title: row.title,
              category: row.category || row.type || "Events",
              host: row.hostName || "Campus host",
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

  // Filter logic
  const filteredEvents = events.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.title.toLowerCase().includes(query) ||
      item.host.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: activeModalEvent.id }),
    });
    const payload = await res.json();
    if (res.status === 401) {
      router.push("/login?redirectTo=/events");
      return;
    }
    if (!res.ok) {
      setBookingError(payload.error?.message || "Could not complete registration");
      return;
    }
    setTicketPass(payload.data?.ticketPass || null);
    setIsBooked(true);
  };

  return (
    <>
      <Navbar forceDarkTop={true} />
      <AgentWidget />

      <main className="min-h-screen bg-primary transition-colors duration-300 pt-28 pb-24 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Centered Header */}
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary mb-3 text-center"
            >
              Discover Campus Events
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-sm sm:text-base max-w-3xl leading-relaxed mx-auto text-center mb-8"
            >
              Explore hackathons, workshops, cultural fests, sports leagues, and party meetups across 120+ active campuses.
            </motion.p>

            {/* Top Minimal Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap justify-center items-center gap-8 md:gap-16 p-4 rounded-2xl bg-card/60 border border-border-subtle/80 max-w-2xl mx-auto shadow-lg"
            >
              <div className="flex flex-col items-center relative">
                <span className="text-lg md:text-xl font-bold font-mono text-text-primary">
                  3,500
                </span>
                <span className="text-xs text-text-secondary font-mono">Registrations</span>
              </div>
              <div className="h-8 w-px bg-border-subtle" />
              <div className="flex flex-col items-center relative">
                <span className="text-lg md:text-xl font-bold font-mono text-text-primary">
                  7,645
                </span>
                <span className="text-xs text-text-secondary font-mono">Students Active</span>
              </div>
              <div className="h-8 w-px bg-border-subtle" />
              <div className="flex flex-col items-center relative">
                <span className="text-lg md:text-xl font-bold font-mono text-text-primary">
                  8
                </span>
                <span className="text-xs text-text-secondary font-mono">Campus Events</span>
              </div>
            </motion.div>
          </div>

          {/* Search & Category Filter Controls Bar */}
          <div className="bg-card border border-border-subtle rounded-2xl p-4 sm:p-5 mb-10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            {/* Search Input */}
            <div className="relative w-full md:w-[420px]">
              <Search className="w-4 h-4 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, host, or location..."
                className="w-full bg-background border border-border-subtle rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-start md:justify-end">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--accent-orange)] text-white shadow-md shadow-orange-500/20"
                        : "bg-background text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-hover"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsive 3-Column Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full py-16 text-center text-text-secondary">
                No events found matching your search.
              </div>
            ) : (
              filteredEvents.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bg-card border border-border-subtle rounded-3xl overflow-hidden flex flex-col justify-between hover:border-border-hover transition-all duration-300 shadow-md group hover:-translate-y-1"
                >
                  {/* Event Cover Image */}
                  <div className="relative w-full h-48 overflow-hidden bg-zinc-900">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-black/30" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-[var(--accent-orange)] border border-white/10 shadow-sm">
                        {item.category}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full backdrop-blur-md shadow-sm border ${
                        item.isFree 
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                          : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                      }`}>
                        {item.price}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <Link href={`/events/${item.id}`}>
                        <h3 className="text-lg font-bold text-text-primary leading-snug mb-1.5 group-hover:text-[var(--accent-orange)] transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                      <p className="text-xs font-medium text-text-secondary mb-4">
                        Hosted by <span className="text-text-primary font-semibold">{item.host}</span>
                      </p>

                      <div className="space-y-2 text-xs text-text-secondary pt-3 border-t border-border-subtle/60 mb-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
                          <span>{item.date} at {item.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
                          <span>{item.attendees}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/events/${item.id}`}
                      className="w-full py-3 rounded-xl font-bold text-xs bg-background text-text-primary border border-border-subtle hover:bg-border-subtle transition-all duration-200 flex items-center justify-center gap-2 group-hover:border-[var(--accent-orange)] cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                      <span>View event</span>
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Completed Events Section (Matching User Reference Image) */}
          <div className="mb-20">
            {/* Header with Icon and Count Badge */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="w-5 h-5 text-blue-400" />
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                  Completed Events
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold flex items-center justify-center">
                    3
                  </span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary">
                Browse past campus events, hackathons, and archived recaps.
              </p>
            </div>

            {/* Completed Events 3-Column Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {COMPLETED_EVENTS.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-card border border-border-subtle rounded-3xl overflow-hidden flex flex-col justify-between hover:border-border-hover transition-all duration-300 shadow-md group hover:-translate-y-1"
                >
                  {/* Image Cover Banner with Badges */}
                  <div className="relative w-full h-44 overflow-hidden bg-zinc-900">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

                    {/* Category & Completed Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                        COMPLETED
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{item.location}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-text-primary leading-snug mb-2 group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-6">
                        {item.desc}
                      </p>
                    </div>

                    {/* Bottom Footer Row: Date & View Recap */}
                    <div className="flex items-center justify-between pt-4 border-t border-border-subtle/60 text-xs">
                      <div className="flex items-center gap-1.5 text-text-secondary font-mono">
                        <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                        <span>{item.date}</span>
                      </div>

                      <button
                        onClick={() => setActiveRecapEvent(item)}
                        className="font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Recap</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Host Event Banner */}
          <div className="bg-card border border-border-subtle rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-orange)]">
                ORGANIZING A CAMPUS EVENT?
              </span>
              <h3 className="text-2xl font-bold text-text-primary mt-1">
                List your event on Uncooked in under 3 minutes
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Get zero-noise ticketing, verified host status, and 100+ scans/min QR check-in app.
              </p>
            </div>

            <Link
              href="/host"
              className="px-8 py-3.5 rounded-full font-bold text-xs text-white shadow-lg shrink-0 transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
                boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.35)",
              }}
            >
              Host Your Event 🚀
            </Link>
          </div>

        </div>
      </main>

      {/* Interactive Ticket Pass Modal */}
      <AnimatePresence>
        {activeModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalEvent(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
            >
              <button
                onClick={() => setActiveModalEvent(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-background text-text-secondary hover:text-text-primary border border-border-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {isBooked ? (
                /* Instant Pass Confirmation View */
                <div className="py-6 text-center flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      TICKET CONFIRMED
                    </span>
                    <h3 className="text-xl font-bold text-text-primary mt-2">
                      {activeModalEvent.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {activeModalEvent.date} at {activeModalEvent.time}
                    </p>
                  </div>

                  {/* QR Digital Ticket Mock Badge */}
                  <div className="bg-background border border-border-subtle rounded-2xl p-4 w-full flex items-center justify-between gap-4 shadow-inner">
                    <div className="p-3 bg-white rounded-xl">
                      <QrCode className="w-12 h-12 text-zinc-900" />
                    </div>
                    <div className="text-left flex-grow">
                      <p className="text-xs font-bold text-text-primary">{bookingData.name}</p>
                      <p className="text-[10px] font-mono text-text-secondary">{bookingData.email}</p>
                      <p className="text-[9px] font-mono text-[var(--accent-orange)] mt-1">
                        PASS ID: {ticketPass?.id || "Issued after sign-in"}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-text-secondary">
                    Your signed pass is saved to your dashboard. Present the QR at the gate. Email delivery is not enabled yet.
                  </p>

                  <button
                    onClick={() => setActiveModalEvent(null)}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-[var(--accent-orange)] text-white shadow-md hover:opacity-90 transition-opacity"
                  >
                    Close & View Ticket
                  </button>
                </div>
              ) : (
                /* Ticket Request Form */
                <div>
                  <div className="mb-6">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-500/10 text-[var(--accent-orange)] border border-orange-500/20">
                      {activeModalEvent.category}
                    </span>
                    <h3 className="text-xl font-bold text-text-primary mt-2">
                      {activeModalEvent.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Hosted by {activeModalEvent.host} • <span className="text-emerald-400 font-semibold">{activeModalEvent.price}</span>
                    </p>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {bookingError && <p className="text-xs text-red-400">{bookingError}</p>}
                    <p className="text-xs text-gray-400">You must be signed in. The pass is issued to your account, not to this form email.</p>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={bookingData.name}
                        onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                        placeholder="Alex Rivera"
                        className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={bookingData.email}
                        onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                        placeholder="alex@campus.edu"
                        className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Number of Passes
                      </label>
                      <select
                        value={bookingData.qty}
                        onChange={(e) => setBookingData({ ...bookingData, qty: Number(e.target.value) })}
                        className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors cursor-pointer"
                      >
                        <option value={1}>1 Ticket Pass</option>
                        <option value={2}>2 Ticket Passes</option>
                        <option value={3}>3 Ticket Passes</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer mt-2"
                      style={{
                        background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
                        boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.35)",
                      }}
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Confirm & Get QR Pass
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Completed Event Recap Modal */}
      <AnimatePresence>
        {activeRecapEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveRecapEvent(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
            >
              <button
                onClick={() => setActiveRecapEvent(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-background text-text-secondary hover:text-text-primary border border-border-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {activeRecapEvent.category} • COMPLETED
                </span>
                <h3 className="text-xl font-bold text-text-primary mt-2">
                  {activeRecapEvent.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Location: {activeRecapEvent.location} • Held on {activeRecapEvent.date}
                </p>
              </div>

              <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 border border-border-subtle">
                <Image
                  src={activeRecapEvent.image}
                  alt={activeRecapEvent.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-4 rounded-2xl bg-background border border-border-subtle mb-6">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                  EVENT RECAP HIGHLIGHTS
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {activeRecapEvent.recapText}
                </p>
              </div>

              <button
                onClick={() => setActiveRecapEvent(null)}
                className="w-full py-3 rounded-xl text-xs font-bold bg-background text-text-primary border border-border-subtle hover:bg-border-subtle transition-colors"
              >
                Close Recap
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
