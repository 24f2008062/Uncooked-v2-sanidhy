"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import InteractiveMesh from "./InteractiveMesh";
import GridScan from "@/components/ui/GridScan";
import BlurText from "@/components/ui/BlurText";

/*
  Floating cards use percentage-based positioning so they scale with
  viewport width. Each card definition includes responsive sizing via
  CSS clamp() and breakpoint-aware positions.
*/
const farLeftCards = [
  {
    src: "/events/cocktail-hour.png",
    alt: "Cocktail Hour",
    delay: 0.2,
    rotate: -2,
    translateX: "-translate-x-6",
  },
  {
    src: "/events/poker-night.png",
    alt: "Poker Night",
    delay: 0.4,
    rotate: 3,
    translateX: "translate-x-2",
  },
  {
    src: "/events/dinner-party.png",
    alt: "Dinner Party",
    delay: 0.6,
    rotate: -1,
    translateX: "-translate-x-4",
  },
];

const innerLeftCards = [
  {
    src: "/events/dinner-party.png",
    alt: "Dinner Party",
    delay: 0,
    rotate: -3,
    translateX: "-translate-x-2",
  },
  {
    src: "/events/hackathon.png",
    alt: "AI Hackathon",
    delay: 0.2,
    rotate: 2,
    translateX: "translate-x-6",
  },
  {
    src: "/events/music-fest.png",
    alt: "Music Festival",
    delay: 0.4,
    rotate: -2,
    translateX: "-translate-x-2",
  },
];

const innerRightCards = [
  {
    src: "/events/beach-party.png",
    alt: "Beach Party",
    delay: 0.1,
    rotate: 3,
    translateX: "translate-x-2",
  },
  {
    src: "/events/workshop.png",
    alt: "Workshop",
    delay: 0.3,
    rotate: -4,
    translateX: "-translate-x-6",
  },
  {
    src: "/events/ai-summit.png",
    alt: "AI Summit",
    delay: 0.5,
    rotate: 2,
    translateX: "translate-x-2",
  },
];

const farRightCards = [
  {
    src: "/events/music-fest.png",
    alt: "Music Festival",
    delay: 0.3,
    rotate: 4,
    translateX: "translate-x-6",
  },
  {
    src: "/events/cocktail-hour.png",
    alt: "Cocktail Hour",
    delay: 0.5,
    rotate: -2,
    translateX: "-translate-x-2",
  },
  {
    src: "/events/beach-party.png",
    alt: "Beach Party",
    delay: 0.7,
    rotate: 1,
    translateX: "translate-x-4",
  },
];

export default function HeroSection() {
  return (
    <section
      className="hero-section relative w-full overflow-hidden text-white"
      style={{
        minHeight: "100vh",
        minHeight: "100dvh",
        background: "#0a0a0a",
      }}
      id="hero-section"
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(244,114,182,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Grid Scan Background */}
      <div className="hidden lg:block absolute inset-0 z-0 opacity-60">
        <GridScan linesColor="#f97316" scanColor="#fb923c" enableWebcam={false} showPreview={false} scanOpacity={0.8} />
      </div>

      {/* Structured Static Cards - Desktop & Tablet */}
      <div className="absolute top-20 bottom-0 left-0 right-0 max-w-[1600px] mx-auto hidden md:flex justify-between items-center px-4 md:px-8 xl:px-12 pointer-events-none z-10 pt-8">
        
        {/* Left Side Containers */}
        <div className="flex gap-4 xl:gap-8 items-center">
          {/* Far Left (Larger) */}
          <div 
            className="flex flex-col gap-6 md:gap-10 xl:gap-12 mt-16" 
            style={{ width: "clamp(120px, 15vw, 256px)" }}
          >
            {farLeftCards.map((card, i) => (
              <motion.div
                key={`far-left-${i}`}
                className={`pointer-events-auto ${card.translateX}`}
                style={{ rotate: `${card.rotate}deg` }}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + card.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ scale: 1.05, rotate: 0, transition: { duration: 0.2 } }}
              >
                <Link href="/events" className="block relative w-full aspect-square rounded-2xl overflow-hidden group shadow-2xl" style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <Image src={card.src} alt={card.alt} fill sizes="(max-width: 1024px) 15vw, 256px" className="object-cover" loading="eager" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Inner Left (Smaller) */}
          <div 
            className="flex flex-col gap-6 md:gap-10 xl:gap-12 mt-24"
            style={{ width: "clamp(90px, 12vw, 192px)" }}
          >
            {innerLeftCards.map((card, i) => (
              <motion.div
                key={`inner-left-${i}`}
                className={`pointer-events-auto ${card.translateX}`}
                style={{ rotate: `${card.rotate}deg` }}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + card.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ scale: 1.05, rotate: 0, transition: { duration: 0.2 } }}
              >
                <Link href="/events" className="block relative w-full aspect-square rounded-2xl overflow-hidden group shadow-xl" style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <Image src={card.src} alt={card.alt} fill sizes="(max-width: 1024px) 12vw, 192px" className="object-cover" loading="eager" priority />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side Containers */}
        <div className="flex gap-4 xl:gap-8 items-center">
          {/* Inner Right (Smaller) */}
          <div 
            className="flex flex-col gap-6 md:gap-10 xl:gap-12 mt-24"
            style={{ width: "clamp(90px, 12vw, 192px)" }}
          >
            {innerRightCards.map((card, i) => (
              <motion.div
                key={`inner-right-${i}`}
                className={`pointer-events-auto ${card.translateX}`}
                style={{ rotate: `${card.rotate}deg` }}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + card.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ scale: 1.05, rotate: 0, transition: { duration: 0.2 } }}
              >
                <Link href="/events" className="block relative w-full aspect-square rounded-2xl overflow-hidden group shadow-xl" style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <Image src={card.src} alt={card.alt} fill sizes="(max-width: 1024px) 12vw, 192px" className="object-cover" loading="eager" priority />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Far Right (Larger) */}
          <div 
            className="flex flex-col gap-6 md:gap-10 xl:gap-12 mt-16"
            style={{ width: "clamp(120px, 15vw, 256px)" }}
          >
            {farRightCards.map((card, i) => (
              <motion.div
                key={`far-right-${i}`}
                className={`pointer-events-auto ${card.translateX}`}
                style={{ rotate: `${card.rotate}deg` }}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + card.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ scale: 1.05, rotate: 0, transition: { duration: 0.2 } }}
              >
                <Link href="/events" className="block relative w-full aspect-square rounded-2xl overflow-hidden group shadow-2xl" style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <Image src={card.src} alt={card.alt} fill sizes="(max-width: 1024px) 15vw, 256px" className="object-cover" loading="eager" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Mobile/Tablet Fallback - Hidden on MD and up */}
      <div className="absolute inset-0 pointer-events-none block md:hidden">
        {innerLeftCards.slice(0, 2).concat(innerRightCards.slice(0, 2)).map((card, i) => (
          <motion.div
            key={`mobile-${i}`}
            className="absolute pointer-events-none"
            style={{
              top: `${20 + i * 18}%`,
              left: i % 2 === 0 ? "5%" : "auto",
              right: i % 2 !== 0 ? "5%" : "auto",
              rotate: `${card.rotate}deg`,
              opacity: 0.35,
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{
              duration: 1,
              delay: 0.5 + card.delay,
            }}
          >
            <div
              style={{
                width: "clamp(60px, 15vw, 100px)",
                height: "clamp(60px, 15vw, 100px)",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <Image
                src={card.src}
                alt={card.alt}
                fill
                sizes="100px"
                className="object-cover"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[100vh] min-h-[100dvh] px-4 sm:px-6 text-center pt-24 pb-16">
        
        {/* Prominent Local Campus Identity Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161619]/90 border border-[#2c2c32] text-xs font-semibold text-amber-400 shadow-[0_0_25px_rgba(249,115,22,0.15)] backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>⚡ Live Across Lucknow &amp; Campus Networks</span>
        </motion.div>

        {/* Brand badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-3"
        >
          <span
            className="text-xs sm:text-sm font-medium tracking-wider uppercase"
            style={{ color: "#737373" }}
          >
            uncooked
            <sup
              className="text-[8px] ml-0.5"
              style={{ color: "var(--accent-orange)" }}
            >
              ✦
            </sup>
          </span>
        </motion.div>

        {/* Main Headline - Fluid responsive typography with BlurText animation */}
        <BlurText
          as="h1"
          className="text-hero justify-center"
          delay={200}
          animateBy="words"
          direction="bottom"
          elements={[
            { text: "Delightful" },
            { text: "<br/>" },
            { text: "events" },
            { text: "<br/>" },
            { text: "start", className: "gradient-text" },
            { text: "here", className: "gradient-text" }
          ]}
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg max-w-sm sm:max-w-lg mx-auto leading-relaxed px-2"
          style={{ color: "#a3a3a3" }}
        >
          From run clubs to launch parties and firework shows, Uncooked makes
          every event feel effortless.
        </motion.p>

        {/* CTA Buttons: create (primary) + discover (secondary) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pointer-events-auto"
        >
          <Link
            href="/create"
            className="btn-primary px-6 sm:px-8 py-3 text-sm sm:text-base min-h-[44px] inline-flex items-center justify-center"
          >
            Create Your First Event
          </Link>
          <Link
            href="/events"
            className="btn-secondary px-6 sm:px-8 py-3 text-sm sm:text-base min-h-[44px] inline-flex items-center justify-center gap-2"
          >
            Discover Events
            <span className="text-xs" aria-hidden>
              →
            </span>
          </Link>
        </motion.div>
      </div>

      {/* Bottom fade gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, var(--bg-primary), transparent)",
        }}
      />
    </section>
  );
}



