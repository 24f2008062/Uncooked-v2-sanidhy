"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const PARTNERS = [
  { short: "UIC", full: "UNIVERSITY INNOVATION CELL" },
  { short: "SC", full: "STARTUP CLUB" },
  { short: "DEV", full: "DEVELOPER SOCIETY" },
  { short: "MKR", full: "MAKER COMMUNITY" },
  { short: "E_HUB", full: "ENTREPRENEURSHIP HUB" },
  { short: "TECH", full: "TECH COUNCIL" }
];

export default function EcosystemPartners() {
  return (
    <section id="ecosystem-partners" className="relative w-full py-20 overflow-hidden bg-primary transition-colors duration-300">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 w-full h-px bg-border-subtle" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 xl:px-12 flex flex-col items-center">
        
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary text-center max-w-3xl leading-tight"
        >
          Ready to Join Campus Events?
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-text-secondary text-sm md:text-base text-center max-w-2xl mt-4 mb-8 leading-relaxed"
        >
          Discover active campus events, join club activities, secure instant tickets, and receive zero-noise logs on the student operating system.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20"
        >
          <Link
            href="/signup"
            className="px-8 py-3.5 rounded-full font-bold text-sm text-white shadow-lg transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
              boxShadow: "0 10px 30px -5px rgba(236, 72, 153, 0.4)",
            }}
          >
            Join Uncooked
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-full font-semibold text-sm text-text-primary bg-card border border-border-subtle hover:bg-border-subtle transition-all duration-300"
          >
            Browse Events
          </Link>
        </motion.div>

        {/* Ecosystem Partners Subtitle */}
        <motion.h3
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase mb-8 text-center"
        >
          BUILT FOR STUDENTS ACROSS THE ECOSYSTEM
        </motion.h3>

        {/* Partner Cards - Forced into 1 single line on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 max-w-[1240px] w-full">
          {PARTNERS.map((partner, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="bg-card border border-border-subtle rounded-2xl px-3 sm:px-4 py-3.5 flex flex-col items-center justify-center shadow-sm hover:border-[var(--accent-orange)] transition-colors group cursor-default text-center"
            >
              <span className="text-text-primary font-bold text-sm md:text-base tracking-wider mb-1 group-hover:text-[var(--accent-orange)] transition-colors">
                {partner.short}
              </span>
              <span className="text-[8px] md:text-[9px] font-medium text-text-secondary uppercase tracking-wider leading-tight">
                {partner.full}
              </span>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
