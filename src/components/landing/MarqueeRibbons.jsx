"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const RIBBON_1_ITEMS = [
  "Delightful Campus Events",
  "Zero-Noise Telemetry",
  "Instant Host Verification",
  "Automated QR Check-in",
  "Student Communities & Clubs",
  "Hackathons & Cultural Fests",
  "Real-Time RSVP Analytics",
  "Inter-College Leagues",
];

const RIBBON_2_ITEMS = [
  "Uncooked OS Platform",
  "Zero-Lag Event Ticketing",
  "Campus Ecosystem Engine",
  "Automated Host Verification",
  "Real-Time Attendee Tracking",
  "Campus Leaderboards & Stats",
  "Enterprise Campus OS",
];

export default function MarqueeRibbons() {
  return (
    <div className="relative w-full overflow-hidden py-10 bg-transparent select-none z-20 pointer-events-none">
      {/* Container for angled ribbons */}
      <div className="relative w-[125%] -left-[12.5%] flex flex-col gap-1 justify-center items-center">
        
        {/* Ribbon 1: Signature Brand Orange Ribbon (Tilted -2deg, moving left faster) */}
        <div 
          className="w-full py-3 shadow-xl flex overflow-hidden border-y border-orange-500/40 z-20"
          style={{
            background: "linear-gradient(90deg, #ea580c 0%, #f97316 50%, #c2410c 100%)",
            transform: "rotate(-2deg) translateY(10px)",
            boxShadow: "0 12px 30px -5px rgba(249, 115, 22, 0.35)",
          }}
        >
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            className="flex shrink-0 whitespace-nowrap items-center gap-8"
          >
            {[...RIBBON_1_ITEMS, ...RIBBON_1_ITEMS].map((item, idx) => (
              <div key={idx} className="flex items-center gap-8">
                <span className="text-xs md:text-sm font-extrabold text-white tracking-widest uppercase flex items-center gap-2">
                  {item}
                </span>
                <span className="text-orange-200/80 font-bold text-xs">✦</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Ribbon 2: Sleek Dark Zinc Ribbon (Tilted +2deg, moving right faster) */}
        <div 
          className="w-full py-3 shadow-2xl flex overflow-hidden border-y border-white/10 z-10"
          style={{
            background: "#09090b",
            transform: "rotate(2deg) translateY(-10px)",
            boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.5)",
          }}
        >
          <motion.div
            animate={{ x: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="flex shrink-0 whitespace-nowrap items-center gap-8"
          >
            {[...RIBBON_2_ITEMS, ...RIBBON_2_ITEMS].map((item, idx) => (
              <div key={idx} className="flex items-center gap-8">
                <span className="text-xs md:text-sm font-extrabold text-zinc-100 tracking-widest uppercase flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-orange)] inline" />
                  {item}
                </span>
                <span className="text-zinc-600 font-bold text-xs">/</span>
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
