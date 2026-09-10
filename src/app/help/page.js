"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LazyAgentWidget from "@/components/ui/LazyAgentWidget";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  BookOpen,
  Ticket,
  User,
  CreditCard,
  Shield,
  Calendar,
  ChevronRight,
  ChevronDown,
  Mail,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";

/* ─── Help Categories ─── */
const HELP_CATEGORIES = [
  {
    title: "Getting Started",
    description:
      "Create your account, browse campus events, and get your first digital pass in under 2 minutes.",
    icon: <BookOpen className="w-5 h-5" />,
    color: "#f472b6",
  },
  {
    title: "Events & Ticketing",
    description:
      "Register for events, manage your passes, join waitlists, and understand ticket types (free & paid).",
    icon: <Ticket className="w-5 h-5" />,
    color: "#fb923c",
  },
  {
    title: "Account & Profile",
    description:
      "Manage your preferences, verify your campus email, update your profile, and control privacy settings.",
    icon: <User className="w-5 h-5" />,
    color: "#34d399",
  },
  {
    title: "Payments & Refunds",
    description:
      "Understand transaction fees, host payout methods, and request refunds for paid events.",
    icon: <CreditCard className="w-5 h-5" />,
    color: "#fbbf24",
  },
  {
    title: "Trust & Safety",
    description:
      "Report issues, learn about host verification (KYC), community guidelines, and content moderation.",
    icon: <Shield className="w-5 h-5" />,
    color: "#a78bfa",
  },
  {
    title: "Hosting Events",
    description:
      "Apply for host privileges, create events, manage registrations, scan QR check-ins, and send bulletins.",
    icon: <Calendar className="w-5 h-5" />,
    color: "#38bdf8",
  },
];

/* ─── FAQs ─── */
const FAQS = [
  {
    q: "How do I register for an event?",
    a: 'Browse events at /events, select one you like, and click "Get Pass". If it\'s a free event you\'ll receive your digital pass instantly. For paid events, complete the checkout first.',
  },
  {
    q: "How do I verify my campus club or student society?",
    a: "Apply from Host → Apply for Verification. Our admin team reviews your organization details and KYC documents. Once approved, your role is elevated to ORGANIZER and you can publish events.",
  },
  {
    q: "Can I get a refund if I can't attend an event?",
    a: "Refund policies are set by individual event hosts. You can request a refund directly from your dashboard up to 24 hours before the event starts, subject to the host's approval.",
  },
  {
    q: "How does QR check-in work?",
    a: "Tickets are HMAC-signed on the server and contain a unique QR code. Event hosts scan attendees using the in-product scanner at /host/scanner. Each code can only be scanned once to prevent duplicate entry.",
  },
  {
    q: "Is there a fee to host free events?",
    a: "Absolutely not! Hosting free campus events on Opportia is completely free, forever. We only take a small, transparent platform fee on paid ticket sales.",
  },
  {
    q: "How do I exercise my data rights under DPDP?",
    a: 'Signed-in users can export or erase data from Profile → Privacy. For grievances or rights requests, use the contact form with the category "DPDP Rights / Grievance". We resolve within 90 days under the DPDP Rules, 2025.',
  },
  {
    q: "What languages does Opportia support?",
    a: "Opportia supports 7 languages: English, Hindi, Japanese, Portuguese, German, Spanish, and French. You can switch languages instantly from Settings → Language.",
  },
  {
    q: "How do I report unlawful content?",
    a: 'Use the contact form with category "Unlawful Content Report" and include the listing URL. We act on lawful takedown notices under the IT Intermediary Rules (as amended 2025).',
  },
];

/* ─── Quick Links ─── */
const QUICK_LINKS = [
  { label: "Browse Events", href: "/events", icon: <Calendar className="w-4 h-4" /> },
  { label: "Create an Event", href: "/host", icon: <Sparkles className="w-4 h-4" /> },
  { label: "Your Dashboard", href: "/dashboard", icon: <Zap className="w-4 h-4" /> },
  { label: "Contact Support", href: "/contact", icon: <Mail className="w-4 h-4" /> },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);

  const filteredFaqs = FAQS.filter((faq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q);
  });

  const filteredCategories = HELP_CATEGORIES.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return cat.title.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
  });

  return (
    <>
      <Navbar forceDarkTop={true} />
      <LazyAgentWidget />

      <main className="min-h-screen bg-primary transition-colors duration-300 pt-28 pb-24 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-orange-500/10 rounded-full blur-2xl md:blur-[140px] opacity-50 md:opacity-100 pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* ─── Hero Header ─── */}
          <div className="text-center max-w-3xl mx-auto mb-16 pt-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border-subtle mb-6 shadow-[0_0_30px_rgba(244,114,182,0.15)]"
            >
              <HelpCircle className="w-7 h-7 text-[var(--accent-pink)]" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-tight mb-6"
            >
              How can we <span className="gradient-text">help you?</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
            >
              Search our knowledge base or browse categories below to find exactly what you&apos;re looking for.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative max-w-2xl mx-auto"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-text-secondary" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for articles, guides, or FAQs..."
                className="w-full bg-background border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
              />
            </motion.div>
          </div>

          {/* ─── Quick Links ─── */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-wrap justify-center gap-3 mb-16"
          >
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-[var(--accent-orange)] transition-all duration-200"
              >
                <span className="text-[var(--accent-orange)]">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </motion.div>

          {/* ─── Help Categories Grid ─── */}
          <div className="mb-28">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent-orange)] mb-3">
                BROWSE TOPICS
              </h2>
              <h3 className="text-2xl sm:text-4xl font-bold text-text-primary">
                Find answers by category
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {filteredCategories.map((cat, i) => (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  className="relative p-6 rounded-3xl bg-card border border-border-subtle cursor-pointer group hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(120% 120% at 50% -20%, ${cat.color}15 0%, transparent 50%)`,
                    }}
                  />

                  <div className="relative z-10 flex flex-col gap-5">
                    <div className="flex justify-between items-start">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: `${cat.color}15`,
                          color: cat.color,
                        }}
                      >
                        {cat.icon}
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-text-primary mb-2 group-hover:text-[var(--accent-orange)] transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-text-secondary">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ─── FAQs Section ─── */}
          <div className="max-w-3xl mx-auto mb-28">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent-orange)] mb-3">
                COMMON QUESTIONS
              </h2>
              <h3 className="text-2xl sm:text-4xl font-bold text-text-primary">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <Search className="w-8 h-8 mx-auto mb-3 text-text-muted" />
                  <p className="text-sm">No results found for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              ) : (
                filteredFaqs.map((faq, index) => {
                  const isOpen = activeFaq === index;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="rounded-2xl bg-card border border-border-subtle overflow-hidden transition-colors hover:border-border-hover"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaq(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-semibold text-text-primary pr-4">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-text-muted shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-[var(--accent-orange)]" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                              <p className="text-sm leading-relaxed text-text-secondary">
                                {faq.a}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* ─── Contact Support CTA ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-8 bg-card border border-border-subtle"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(244,114,182,0.05)] to-[rgba(249,115,22,0.05)] pointer-events-none" />

            <div className="relative z-10 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
                Still need help?
              </h2>
              <p className="text-text-secondary text-sm sm:text-base">
                Our support team is ready to assist you with any questions.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/contact"
                className="px-6 py-3 rounded-xl bg-background border border-border-subtle text-text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:border-[var(--accent-orange)] transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-[var(--accent-orange)]" />
                Contact Form
              </Link>
              <a
                href="mailto:support@opportia.in"
                className="px-6 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
              >
                <Mail className="w-4 h-4" />
                support@opportia.in
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
