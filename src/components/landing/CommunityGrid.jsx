"use client";

import { motion } from "framer-motion";
import { BookOpen, Palette, Rocket, Globe } from "lucide-react";

const communities = [
  {
    id: "reading-rhythms",
    name: "Reading Rhythms Global",
    description: "Not a cool club. A reading party. Read with friends to...",
    icon: <BookOpen className="w-5 h-5" />,
    color: "#f472b6",
    members: "12.4K",
  },
  {
    id: "buildz-club",
    name: "Buildz Club",
    description: "The most collaborative AI community in the world! ISO...",
    icon: <Rocket className="w-5 h-5" />,
    color: "#818cf8",
    members: "8.2K",
  },
  {
    id: "south-park-commons",
    name: "South Park Commons",
    description: "South Park Commons helps you get from -1 to 0. To ear...",
    icon: <Globe className="w-5 h-5" />,
    color: "#34d399",
    members: "5.6K",
  },
  {
    id: "design-buddies",
    name: "Design Buddies",
    description: "Events for all creatives across SF/LA, online, and t...",
    icon: <Palette className="w-5 h-5" />,
    color: "#fb923c",
    members: "15.1K",
  },
];

export default function CommunityGrid() {
  return (
    <section className="section-padding pt-6" id="communities">
      <div className="content-container">
        {/* Section Header */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl font-bold mb-6 text-text-primary text-center"
        >
          Explore Global Communities
        </motion.h2>

        {/* Grid - Constrained max-width to keep boxes smaller */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1100px] mx-auto">
          {communities.map((community, i) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div 
                className="relative p-5 rounded-2xl cursor-pointer group hover:-translate-y-1 transition-all duration-300"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {/* Glassy Glow Overlay (Visible on Hover) */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(120% 120% at 50% -20%, ${community.color}25 0%, transparent 50%)`,
                    boxShadow: `inset 0 1px 2px ${community.color}50, 0 8px 24px ${community.color}15`,
                    border: `1px solid ${community.color}30`
                  }}
                />

                <div className="relative z-10 flex flex-col gap-3">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: community.color === "#ffffff" ? "#222" : `${community.color}15`,
                      color: community.color,
                    }}
                  >
                    {community.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <h3
                      className="text-sm sm:text-base font-semibold truncate text-text-primary"
                    >
                      {community.name}
                    </h3>
                    <p
                      className="text-[13px] leading-snug line-clamp-2 text-text-secondary"
                    >
                      {community.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
