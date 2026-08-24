"use client";

import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  Gamepad2,
  Cpu,
  UtensilsCrossed,
  Brain,
  Footprints,
  Palette,
  Leaf,
  Dumbbell,
  Heart,
  Coins,
} from "lucide-react";

import Image from "next/image";

const categories = [
  { name: "Family", icon: <Image src="/events/family-icon.png" width={48} height={48} alt="Family" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />, color: "#f472b6" },
  { name: "Books", icon: <Image src="/events/books-icon.png" width={48} height={48} alt="Books" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />, color: "#fb923c" },
  { name: "Games", icon: <Image src="/events/ffea27ad-b4a8-45c3-8627-851bfb7d84a2.png" width={48} height={48} alt="Games" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />, color: "#fbbf24" },
  { name: "Tech", icon: <Cpu className="w-10 h-10 sm:w-12 sm:h-12" />, color: "#818cf8" },
  {
    name: "Food & Drink",
    icon: <Image src="/events/food-icon.png" width={48} height={48} alt="Food & Drink" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />,
    color: "#f87171",
  },
  { name: "AI", icon: <Image src="/events/ai-icon.png" width={48} height={48} alt="AI" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />, color: "#a78bfa" },
  {
    name: "Running",
    icon: <Footprints className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: "#34d399",
  },
  {
    name: "Arts & Culture",
    icon: <Palette className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: "#f472b6",
  },
  { name: "Climate", icon: <Leaf className="w-10 h-10 sm:w-12 sm:h-12" />, color: "#4ade80" },
  {
    name: "Fitness",
    icon: <Dumbbell className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: "#60a5fa",
  },
  { name: "Wellness", icon: <Image src="/events/wellness-icon.png" width={48} height={48} alt="Wellness" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />, color: "#fb7185" },
  { name: "Crypto", icon: <Coins className="w-10 h-10 sm:w-12 sm:h-12" />, color: "#fbbf24" },
];

export default function CategoryGrid() {
  return (
    <section className="section-padding pt-6" id="categories">
      <div className="content-container">
        {/* Section Header */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl font-bold mb-6 text-text-primary text-center"
        >
          Browse by Category
        </motion.h2>

        {/* Grid - Constrained max-width to keep boxes smaller and compact */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 max-w-[1100px] mx-auto">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <div 
                className="relative flex flex-col justify-between aspect-square rounded-2xl cursor-pointer group hover:-translate-y-1 transition-all duration-300"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {/* Glassy Glow Overlay (Visible on Hover) */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(120% 120% at 50% -20%, ${cat.color}25 0%, transparent 50%)`,
                    boxShadow: `inset 0 1px 2px ${cat.color}50, 0 8px 24px ${cat.color}15`,
                    border: `1px solid ${cat.color}30`
                  }}
                />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-5">
                  <div
                    className="transition-transform duration-300 group-hover:scale-110"
                    style={{ color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <span 
                    className="text-xs sm:text-sm font-medium tracking-tight group-hover:-translate-y-1 transition-transform duration-300 text-text-primary"
                  >
                    {cat.name}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
