"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import LazyAgentWidget from "@/components/ui/LazyAgentWidget";
import Link from "next/link";
import Image from "next/image";
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Users, 
  Globe, 
  Terminal, 
  ArrowRight, 
  CheckCircle2, 
  Award,
  Layers,
  Heart,
  ExternalLink
} from "lucide-react";

function LinkedInIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.96 0-1.74.78-1.74 1.74s.78 1.74 1.74 1.74 1.74-.78 1.74-1.74-.78-1.74-1.74-1.74Z" />
    </svg>
  );
}

const STATS = [
  { value: "Campus-first", label: "Events & hosts" },
  { value: "India", label: "DPDP-aligned privacy" },
  { value: "18+", label: "Age requirement" },
  { value: "HMAC", label: "Signed digital passes" },
];

const PILLARS = [
  {
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    title: "Zero Noise Telemetry",
    desc: "Offline first QR check ins processing 100+ scans/min without network latency or queue bottlenecks.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
    title: "Verified Host Engine",
    desc: "Rigorous host verification ensuring safe, legitimate, and campus-approved student club events.",
  },
  {
    icon: <Users className="w-6 h-6 text-orange-500" />,
    title: "Delightful UX First",
    desc: "Zero friction ticketing, instant pass delivery to digital wallets, and zero clutter.",
  },
  {
    icon: <Globe className="w-6 h-6 text-purple-500" />,
    title: "Connected Ecosystem",
    desc: "Unifying tech societies, sports leagues, run clubs, and hackathons under one operating system.",
  },
];

const TIMELINE = [
  {
    year: "2024",
    title: "The Campus Friction",
    desc: "Started as a simple QR tool to solve long check in lines at college hackathons.",
  },
  {
    year: "2025",
    title: "Zero Noise Architecture",
    desc: "Engineered offline sync, automated host verification, and custom telemetry for 30+ clubs.",
  },
  {
    year: "2026",
    title: "The Campus Operating System",
    desc: "Expanded across 120+ campuses with live feed bulletins, instant ticketing, and AI assistant Aura.",
  },
];

const TEAM = [
  {
    name: "Shushant Shukla",
    role: "Founder",
    linkedin: "https://www.linkedin.com/in/shushantshukla/",
    avatar: "https://ui-avatars.com/api/?name=Shushant+Shukla&background=ea580c&color=ffffff&bold=true&size=256",
    bio: "Pioneering the zero-noise campus event ecosystem, driving product vision, and empowering student organizers nationwide.",
  },
  {
    name: "Siddhartha Bhowmik",
    role: "Co-Founder",
    linkedin: "https://www.linkedin.com/in/siddhartha-bhowmik-121026205/",
    avatar: "https://ui-avatars.com/api/?name=Siddhartha+Bhowmik&background=2563eb&color=ffffff&bold=true&size=256",
    bio: "Engineering resilient campus event architectures, offline-first verification, and high-performance student telemetry.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar forceDarkTop={true} />
      <LazyAgentWidget />

      <main className="min-h-screen bg-primary transition-colors duration-300 pt-28 pb-24 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-orange-500/10 rounded-full blur-2xl md:blur-[140px] opacity-50 md:opacity-100 pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-tight mb-6"
            >
              The Zero Noise Operating System for <span className="gradient-text">Campus Ecosystems</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-base sm:text-lg leading-relaxed"
            >
              Opportia was built to eliminate fragmented spreadsheets, long check in queues, and manual follow ups for student organizers, creating a seamless platform for every campus event.
            </motion.p>
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle shadow-xl mb-24"
          >
            {STATS.map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4">
                <span className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-1">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm font-medium text-text-secondary">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Pillars Section */}
          <div className="mb-28">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent-orange)] mb-3">
                OUR CORE PILLARS
              </h2>
              <h3 className="text-2xl sm:text-4xl font-bold text-text-primary">
                Engineered for reliability & student delight
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PILLARS.map((pillar, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border-subtle rounded-2xl p-6 flex flex-col hover:border-[var(--accent-orange)] transition-all duration-300 group"
                >
                  <div className="p-3 rounded-xl bg-background w-fit mb-5 group-hover:scale-110 transition-transform">
                    {pillar.icon}
                  </div>
                  <h4 className="text-lg font-bold text-text-primary mb-2">
                    {pillar.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {pillar.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Evolution Timeline */}
          <div className="mb-28 bg-card/50 border border-border-subtle rounded-3xl p-8 sm:p-12">
            <div className="max-w-2xl mb-12">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent-orange)] mb-3">
                OUR JOURNEY
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
                From a hackathon queue tool to a full campus OS
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative flex flex-col space-y-3"
                >
                  <span className="text-3xl font-extrabold text-[var(--accent-orange)]">
                    {item.year}
                  </span>
                  <h4 className="text-base font-bold text-text-primary">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Leadership Team */}
          <div className="mb-24">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent-orange)] mb-3">
                THE TEAM BEHIND OPPORTIA
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Built by builders, for student leaders
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {TEAM.map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-card border border-border-subtle hover:border-[var(--accent-orange)]/50 rounded-3xl p-7 sm:p-8 flex flex-col items-center text-center shadow-lg transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-border-subtle group-hover:border-[var(--accent-orange)] transition-colors shadow-md">
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-xl font-bold text-text-primary mb-1">
                    {member.name}
                  </h4>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-orange)] mb-3 px-3 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/25">
                    {member.role}
                  </span>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6 flex-1">
                    {member.bio}
                  </p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white border border-[#0A66C2]/30 transition-all duration-200 shadow-sm group/btn cursor-pointer"
                    title={`Connect with ${member.name} on LinkedIn`}
                  >
                    <LinkedInIcon className="w-3.5 h-3.5 fill-current" />
                    <span>Connect on LinkedIn</span>
                    <ExternalLink className="w-3 h-3 opacity-70 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </a>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-2xl">
            <h3 className="text-2xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Ready to bring OPPORTIA to your campus?
            </h3>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto mb-8 leading-relaxed">
              Join 500+ student organizers hosting zero-noise events today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3.5 rounded-full font-bold text-sm bg-white text-zinc-900 hover:bg-zinc-100 transition-colors shadow-lg"
              >
                Create Your Event
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3.5 rounded-full font-semibold text-sm bg-black/20 hover:bg-black/30 border border-white/20 text-white transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
