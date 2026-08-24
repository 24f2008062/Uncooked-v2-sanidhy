"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function FooterCTA() {
  return (
    <section
      className="relative py-32 px-6 overflow-hidden"
      id="footer-cta"
    >
      {/* Dot matrix background */}
      <div className="absolute inset-0 dot-matrix opacity-60" />

      {/* Animated gradient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(244,114,182,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(251,146,60,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse-glow 5s ease-in-out infinite 1s",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
        >
          <span className="gradient-text-cta">Your next unforgettable</span>
          <br />
          <span style={{ color: "var(--text-primary)" }}>memory</span>{" "}
          <span className="gradient-text-cta">awaits.</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/dashboard" className="btn-primary px-8 py-3 text-base">
            Discover Events →
          </Link>
          <Link href="/app" className="btn-secondary px-8 py-3 text-base">
            Get the App
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
