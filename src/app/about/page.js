"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AgentWidget from "@/components/ui/AgentWidget";
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
  Heart
} from "lucide-react";

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
    name: "Alex Rivera",
    role: "Founder & Lead Architect",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    bio: "Building zero noise event infrastructure for the next generation of campus leaders.",
  },
  {
    name: "Samantha Chen",
    role: "Head of Design & UX",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&auto=format&fit=crop",
    bio: "Crafting fluid, glassmorphic interfaces that turn chaotic event logistics into pure delight.",
  },
  {
    name: "Devon Vance",
    role: "VP of Ecosystem Growth",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
    bio: "Empowering 500+ student organizers, startup cells, and tech societies globally.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar forceDarkTop={true} />
      <AgentWidget />

      <main className="min-h-screen bg-primary transition-colors duration-300 pt-28 pb-24 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

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
              Uncooked was built to eliminate fragmented spreadsheets, long check in queues, and manual follow ups for student organizers — creating a seamless platform for every campus event.
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
                THE TEAM BEHIND UNCOOKED
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Built by builders, for student leaders
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {TEAM.map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border-subtle rounded-2xl p-6 flex flex-col items-center text-center hover:border-border-hover transition-colors"
                >
                  <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-border-subtle">
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-base font-bold text-text-primary">
                    {member.name}
                  </h4>
                  <span className="text-xs font-medium text-[var(--accent-orange)] mb-3">
                    {member.role}
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {member.bio}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-2xl">
            <h3 className="text-2xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Ready to bring Uncooked to your campus?
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

      <Footer />
    </>
  );
}
