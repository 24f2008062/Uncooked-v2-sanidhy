"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LazyAgentWidget from "@/components/ui/LazyAgentWidget";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  Check,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  Users,
  QrCode,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Calendar,
  BadgeCheck,
  Ticket,
  Building2,
  Headphones,
  MessageSquare,
  Clock,
  ExternalLink,
  CheckCircle2
} from "lucide-react";

export default function PricingPage() {
  const { t } = useLanguage();
  const { mode } = useTheme();

  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "annually"
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState("plus");
  const [activationState, setActivationState] = useState("idle"); // "idle" | "activating" | "success"

  const handleOpenUpgradeModal = (planKey) => {
    setSelectedPlanForModal(planKey);
    setActivationState("idle");
    setUpgradeModalOpen(true);
  };

  const handleActivatePlus = () => {
    setActivationState("activating");
    setTimeout(() => {
      setActivationState("success");
    }, 1200);
  };

  // Frequently Asked Questions
  const FAQS = [
    {
      q: "How does the 0% platform fee work?",
      a: "When you upgrade your calendar to Opportia Plus, Opportia waives our entire 3% platform commission on all paid tickets sold under that calendar. Standard payment gateway processing fees (e.g. Stripe / Razorpay) apply directly to your payout account without any markups.",
    },
    {
      q: "What does 'calendar-level' membership mean?",
      a: "Opportia Plus applies to an entire calendar ecosystem. You can host an unlimited number of events under that calendar with zero platform fees, expanded invite limits, and scanner seats without paying per individual event.",
    },
    {
      q: "Can my co-organizers scan tickets without their own Plus subscription?",
      a: "Yes! As a Plus calendar owner, you can add up to 10 co-hosts or volunteer scanners to your calendar. They get access to the high-speed QR check-in camera scanner on their mobile devices without needing their own paid subscription.",
    },
    {
      q: "Can I cancel or switch billing cycles anytime?",
      a: "Absolutely. You can change your billing interval or cancel your subscription at any time from your Payment Settings tab. You will retain all Plus benefits until the end of your current billing cycle, with zero cancellation fees.",
    },
    {
      q: "Do you offer student council or university festival invoicing?",
      a: "Yes! For verified Student Councils, academic departments, and inter-college festivals, our Campus Pro tier supports direct university purchase orders, institutional invoicing, and college vendor registration.",
    },
  ];

  // Feature Comparison Data
  const COMPARISON_CATEGORIES = [
    {
      category: "Ticketing & Economics",
      features: [
        {
          name: "Platform Fee on Paid Tickets",
          starter: "3%",
          plus: "0% (Zero Fee)",
          campus: "0% (Zero Fee)",
          highlight: true,
        },
        {
          name: "Platform Fee on Free Tickets",
          starter: "0%",
          plus: "0%",
          campus: "0%",
        },
        {
          name: "Attendee Limit per Event",
          starter: "Up to 250",
          plus: "Unlimited",
          campus: "Unlimited",
          highlight: true,
        },
        {
          name: "Custom Ticket Tiers & Early Bird",
          starter: "Up to 2 tiers",
          plus: "Unlimited tiers",
          campus: "Unlimited tiers",
        },
      ],
    },
    {
      category: "Team & Check-in Operations",
      features: [
        {
          name: "Host & Admin Accounts",
          starter: "1 Host",
          plus: "Up to 10 Co-Hosts",
          campus: "Unlimited Seats",
        },
        {
          name: "High-Speed QR Ticket Scanners",
          starter: "1 device",
          plus: "Up to 10 simultaneous scanners",
          campus: "Unlimited scanners",
          highlight: true,
        },
        {
          name: "Staff Role Permissions",
          starter: "None",
          plus: "Included (Scanner / Admin / Editor)",
          campus: "Granular RBAC + SSO",
        },
      ],
    },
    {
      category: "Branding & Communication",
      features: [
        {
          name: "Automated WhatsApp Ticket Delivery",
          starter: false,
          plus: true,
          campus: true,
          highlight: true,
        },
        {
          name: "SMS Pass Confirmation",
          starter: false,
          plus: true,
          campus: true,
        },
        {
          name: "Custom Society Branding & Colors",
          starter: false,
          plus: true,
          campus: true,
        },
        {
          name: "Custom University Subdomain",
          starter: false,
          plus: false,
          campus: true,
        },
      ],
    },
    {
      category: "Data & Support",
      features: [
        {
          name: "Attendee Data CSV Export",
          starter: "Basic fields",
          plus: "Full export + custom forms",
          campus: "Full API + CRM webhooks",
        },
        {
          name: "Festival Check-in Analytics",
          starter: "Basic summary",
          plus: "Real-time graphs & throughput",
          campus: "Executive campus dashboard",
        },
        {
          name: "Support Channel",
          starter: "Community email",
          plus: "24/7 Dedicated Fest Hotline",
          campus: "Dedicated Account Manager & SLA",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Top Breadcrumbs & Back to Settings */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <nav className="flex items-center gap-2 text-xs text-text-muted">
            <Link href="/" className="hover:text-text-primary transition-colors">
              {t("pricing.breadcrumbHome", "Home")}
            </Link>
            <span>/</span>
            <Link href="/settings" className="hover:text-text-primary transition-colors">
              {t("pricing.breadcrumbSettings", "Settings")}
            </Link>
            <span>/</span>
            <Link href="/settings?tab=payment" className="hover:text-text-primary transition-colors">
              {t("pricing.breadcrumbPayment", "Payment")}
            </Link>
            <span>/</span>
            <span className="text-text-primary font-semibold">Opportia Plus</span>
          </nav>

          <Link
            href="/settings?tab=payment"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg bg-card border border-border-subtle hover:border-border-hover"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("pricing.ctaBanner.backBtn", "Return to Settings")}</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-pink-500/10 text-[var(--accent-pink)] border border-pink-500/20 shadow-sm">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>{t("pricing.badge", "OPPORTIA PLUS & PRICING")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
            {t("pricing.title", "The Zero-Fee Operating System for Campus Hosts")}
          </h1>

          <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
            {t(
              "pricing.subtitle",
              "Enjoy 0% platform fees, unlimited attendee passes, dedicated festival support, and multi-admin check-in staff."
            )}
          </p>

          {/* Social Proof Trust Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>500+ Verified Campus Societies</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>0% Platform Fees on Paid Tickets</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Instant QR Validation & Check-in</span>
            </span>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="pt-6 flex items-center justify-center">
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-card border border-border-subtle shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-secondary text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {t("pricing.monthly", "Monthly")}
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("annually")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  billingCycle === "annually"
                    ? "bg-secondary text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <span>{t("pricing.annually", "Annually")}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-sm">
                  {t("pricing.save20", "Save 20%")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Tier Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-20">
          {/* TIER 1: Free Host */}
          <div className="rounded-3xl bg-card border border-border-subtle p-7 flex flex-col justify-between hover:border-border-hover transition-all duration-200">
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {t("pricing.plans.starter.name", "Free Host")}
                </span>
                <p className="text-xs text-text-muted mt-1.5 min-h-[36px]">
                  {t(
                    "pricing.plans.starter.desc",
                    "For student organizers hosting occasional meetups and campus hackathons."
                  )}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-4xl font-extrabold text-text-primary tracking-tight">
                  {t("pricing.plans.starter.price", "₹0")}
                </span>
                <span className="text-xs text-text-muted">
                  {t("pricing.plans.starter.period", "forever free")}
                </span>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-3">
                <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  What is included:
                </div>
                <ul className="space-y-2.5 text-xs text-text-secondary">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>3% platform fee on paid tickets</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Up to 250 attendees per event</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>1 Host / Organizer account</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Standard QR ticketing & pass generation</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Basic attendee export</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-text-muted">
                    <X className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                    <span>No WhatsApp or SMS ticket broadcasts</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                disabled
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-secondary text-text-muted border border-border-subtle cursor-default text-center"
              >
                {t("pricing.plans.starter.cta", "Current Plan")}
              </button>
            </div>
          </div>

          {/* TIER 2: Opportia Plus (Featured / Most Popular) */}
          <div className="relative rounded-3xl bg-card border-2 border-pink-500/40 p-7 flex flex-col justify-between shadow-2xl shadow-pink-500/10 hover:border-pink-500/60 transition-all duration-200">
            {/* Radiant floating pill */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 text-white shadow-md">
              {t("pricing.mostPopular", "Most Popular")}
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-pink)]">
                    {t("pricing.plans.plus.name", "Opportia Plus")}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    CALENDAR PASS
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1.5 min-h-[36px]">
                  {t(
                    "pricing.plans.plus.desc",
                    "For active campus societies, tech clubs, cultural fests, and serious student hosts."
                  )}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-4xl font-black text-text-primary tracking-tight">
                  {billingCycle === "monthly"
                    ? t("pricing.plans.plus.priceMonthly", "₹999")
                    : t("pricing.plans.plus.priceAnnually", "₹799")}
                </span>
                <span className="text-xs text-text-muted">
                  {t("pricing.perMonth", "/ month")}
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                {billingCycle === "monthly"
                  ? t("pricing.billedMonthly", "billed monthly")
                  : t("pricing.billedAnnually", "billed annually (₹9,588 / yr)")}
              </p>

              <div className="pt-2 border-t border-border-subtle space-y-3">
                <div className="text-[11px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Everything in Free Host, plus:</span>
                </div>
                <ul className="space-y-2.5 text-xs text-text-primary">
                  <li className="flex items-start gap-2.5 font-semibold text-emerald-400">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>0% platform fees on all ticket sales</span>
                  </li>
                  <li className="flex items-start gap-2.5 font-semibold">
                    <Check className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>Unlimited attendees and ticket passes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>Up to 10 co-hosts and scanner accounts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>Automated WhatsApp & SMS ticket pass delivery</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>Custom society branding & custom badge theme</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>Full attendee CSV export & check-in metrics</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>24/7 dedicated fest hotline & priority support</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleOpenUpgradeModal("plus")}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-orange-400 to-amber-500 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
              >
                <span>{t("pricing.upgradeNow", "Upgrade to Opportia Plus")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TIER 3: Campus Pro */}
          <div className="rounded-3xl bg-card border border-border-subtle p-7 flex flex-col justify-between hover:border-border-hover transition-all duration-200">
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {t("pricing.plans.campus.name", "Campus Pro")}
                </span>
                <p className="text-xs text-text-muted mt-1.5 min-h-[36px]">
                  {t(
                    "pricing.plans.campus.desc",
                    "For Student Councils, Universities, and inter-college festival boards."
                  )}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-4xl font-extrabold text-text-primary tracking-tight">
                  {t("pricing.plans.campus.price", "Custom")}
                </span>
                <span className="text-xs text-text-muted">
                  {t("pricing.plans.campus.period", "annual institutional")}
                </span>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-3">
                <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Campus-Wide Infrastructure:
                </div>
                <ul className="space-y-2.5 text-xs text-text-secondary">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Everything in Opportia Plus</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Multi-calendar centralized university console</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Campus SSO & college domain email whitelisting</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Custom college subdomain & white-labeling</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Direct university purchase orders & invoice billing</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Dedicated Account Manager with SLA agreement</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleOpenUpgradeModal("campus")}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-secondary hover:bg-card-hover text-text-primary border border-border-subtle transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <span>{t("pricing.contactSales", "Contact Campus Team")}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Comparison Matrix Table */}
        <section className="mb-24 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              {t("pricing.featuresTitle", "Compare Plan Capabilities")}
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              {t(
                "pricing.featuresSubtitle",
                "Every tool you need to run professional, zero-noise college events."
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-border-subtle bg-card overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-secondary/60">
                    <th className="p-4 sm:p-5 font-bold text-text-primary w-2/5">Capability</th>
                    <th className="p-4 sm:p-5 font-bold text-text-muted w-1/5">Free Host</th>
                    <th className="p-4 sm:p-5 font-bold text-[var(--accent-pink)] w-1/5 bg-pink-500/5">
                      Opportia Plus
                    </th>
                    <th className="p-4 sm:p-5 font-bold text-text-muted w-1/5">Campus Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_CATEGORIES.map((cat, idx) => (
                    <React.Fragment key={idx}>
                      <tr className="border-b border-border-subtle bg-secondary/30">
                        <td
                          colSpan={4}
                          className="px-4 py-2.5 font-bold uppercase tracking-wider text-[11px] text-text-secondary"
                        >
                          {cat.category}
                        </td>
                      </tr>
                      {cat.features.map((feat, fIdx) => (
                        <tr
                          key={fIdx}
                          className="border-b border-border-subtle/60 hover:bg-secondary/20 transition-colors"
                        >
                          <td className="p-4 font-medium text-text-primary flex items-center gap-2">
                            <span>{feat.name}</span>
                            {feat.highlight && (
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                            )}
                          </td>

                          {/* Free Starter Column */}
                          <td className="p-4 text-text-secondary">
                            {typeof feat.starter === "boolean" ? (
                              feat.starter ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <X className="w-4 h-4 text-text-muted/60" />
                              )
                            ) : (
                              <span>{feat.starter}</span>
                            )}
                          </td>

                          {/* Plus Column */}
                          <td className="p-4 font-bold text-text-primary bg-pink-500/5">
                            {typeof feat.plus === "boolean" ? (
                              feat.plus ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <X className="w-4 h-4 text-text-muted/60" />
                              )
                            ) : (
                              <span className={feat.highlight ? "text-pink-400" : ""}>
                                {feat.plus}
                              </span>
                            )}
                          </td>

                          {/* Campus Column */}
                          <td className="p-4 text-text-secondary">
                            {typeof feat.campus === "boolean" ? (
                              feat.campus ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <X className="w-4 h-4 text-text-muted/60" />
                              )
                            ) : (
                              <span>{feat.campus}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Interactive FAQ Section */}
        <section className="mb-24 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              {t("pricing.faqTitle", "Frequently Asked Questions")}
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              {t(
                "pricing.faqSubtitle",
                "Everything you need to know about Opportia Plus and calendar memberships."
              )}
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-card border border-border-subtle overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-text-primary">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-text-primary" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-text-muted leading-relaxed border-t border-border-subtle/50 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Conversion Banner */}
        <section className="rounded-3xl p-8 sm:p-12 relative overflow-hidden bg-card border border-border-subtle shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight">
              {t(
                "pricing.ctaBanner.title",
                "Ready to supercharge your campus community?"
              )}
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              {t(
                "pricing.ctaBanner.subtitle",
                "Join over 500+ verified college societies and student organizers using Opportia Plus."
              )}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleOpenUpgradeModal("plus")}
                className="px-6 py-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-orange-400 to-amber-500 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-pink-500/25 flex items-center gap-2"
              >
                <span>{t("pricing.ctaBanner.upgradeBtn", "Get Started with Plus")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/settings?tab=payment"
                className="px-6 py-3.5 rounded-xl text-xs font-bold text-text-primary bg-secondary hover:bg-card-hover border border-border-subtle transition-all"
              >
                {t("pricing.ctaBanner.backBtn", "Return to Settings")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Interactive Upgrade Modal */}
      <AnimatePresence>
        {upgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl bg-card border border-border-hover p-6 shadow-2xl relative overflow-hidden"
            >
              {activationState === "success" ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Opportia Plus Activated!
                  </h3>
                  <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
                    Your personal calendar has been successfully upgraded to Opportia Plus. You now enjoy 0% platform fees and priority scanner limits.
                  </p>
                  <div className="pt-4 flex flex-col gap-2">
                    <Link
                      href="/settings?tab=payment"
                      className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-orange-400 text-center hover:brightness-110 transition-all"
                    >
                      View in Payment Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => setUpgradeModalOpen(false)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : selectedPlanForModal === "campus" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-sm font-bold text-text-primary">Campus Pro Inquiry</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeModalOpen(false)}
                      className="p-1 text-text-muted hover:text-text-primary rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Connect your entire college ecosystem or student affairs office with university SSO, custom subdomains, and institutional purchase invoicing.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="p-3 rounded-xl bg-secondary border border-border-subtle flex items-center justify-between">
                      <span className="text-text-secondary font-medium">Dedicated Contact:</span>
                      <span className="font-bold text-text-primary">campus@opportia.com</span>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <a
                      href="mailto:campus@opportia.com?subject=Campus%20Pro%20University%20Inquiry"
                      className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 text-center transition-colors"
                    >
                      Send Email to University Team
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-500" />
                      <h3 className="text-sm font-bold text-text-primary">
                        Activate Opportia Plus
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeModalOpen(false)}
                      className="p-1 text-text-muted hover:text-text-primary rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Plan Summary */}
                  <div className="p-3.5 rounded-2xl bg-secondary border border-border-subtle flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-text-primary">
                        Personal Calendar Membership
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {billingCycle === "monthly"
                          ? "Monthly recurring subscription"
                          : "Annual recurring subscription (Save 20%)"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-text-primary">
                        {billingCycle === "monthly" ? "₹999 / mo" : "₹799 / mo"}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        0% Platform Fee
                      </div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-2 text-xs text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zero platform commissions on all ticket sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Up to 10 simultaneous ticket scanner seats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cancel anytime directly from payment settings</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={activationState === "activating"}
                      onClick={handleActivatePlus}
                      className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-orange-400 to-amber-500 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {activationState === "activating" ? (
                        <span>Activating Opportia Plus...</span>
                      ) : (
                        <>
                          <span>Confirm & Activate Plus</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
      <LazyAgentWidget />
    </div>
  );
}
