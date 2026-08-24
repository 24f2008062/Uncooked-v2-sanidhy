"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Shield,
  BarChart3,
  QrCode,
  Bell,
  Ticket,
} from "lucide-react";

const features = [
  {
    icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: "Smart Discovery",
    description:
      "AI-powered recommendation engine learns your interests and surfaces the most relevant events for you.",
    color: "#f472b6",
  },
  {
    icon: <Ticket className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: "Digital Tickets & QR Passes",
    description:
      "Beautiful digital tickets with QR codes. Download, share, and check in seamlessly at any event.",
    color: "#818cf8",
  },
  {
    icon: <Bell className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: "Real-Time Updates",
    description:
      "Live event bulletins, chat rooms, and instant notifications powered by WebSocket technology.",
    color: "#34d399",
  },
  {
    icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: "Verified Hosts",
    description:
      "Every organizer goes through our KYC verification process to ensure safety and trust.",
    color: "#fb923c",
  },
  {
    icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: "Organizer Analytics",
    description:
      "Comprehensive dashboards with ticket sales, check-in rates, audience demographics, and more.",
    color: "#a78bfa",
  },
  {
    icon: <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: "Instant Check-In",
    description:
      "Hosts scan QR codes for instant check-in. No lines, no paper, no friction.",
    color: "#fbbf24",
  },
];

export default function FeaturesSection() {
  return (
    <section
      className="section-padding relative"
      id="features-section"
      style={{
        background:
          "linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)",
      }}
    >
      {/* Decorative gradient line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] sm:w-[300px] h-[1px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(244,114,182,0.3), transparent)",
        }}
      />

      <div className="content-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span
            className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-3 sm:mb-4 block"
            style={{ color: "var(--accent-pink)" }}
          >
            Platform Features
          </span>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Everything you need to{" "}
            <span className="gradient-text">create magic</span>
          </h2>
          <p
            className="text-sm sm:text-base max-w-sm sm:max-w-lg mx-auto px-4"
            style={{ color: "var(--text-secondary)" }}
          >
            From discovery to check-in, we&apos;ve built every tool an event
            ecosystem needs.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-card p-5 sm:p-6 group relative overflow-hidden"
            >
              {/* Background gradient */}
              <div
                className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${feature.color}08, transparent 70%)`,
                  filter: "blur(20px)",
                }}
              />

              {/* Icon */}
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 relative z-10"
                style={{
                  background: `${feature.color}12`,
                  color: feature.color,
                }}
              >
                {feature.icon}
              </div>

              {/* Content */}
              <h3
                className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2 relative z-10"
                style={{ color: "var(--text-primary)" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-xs sm:text-sm leading-relaxed relative z-10"
                style={{ color: "var(--text-muted)" }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
