"use client";

import { motion } from "framer-motion";
import { Terminal, Bell, Radio, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const INITIAL_BULLETINS = [
  { id: 1, text: "Career Counselling Festival: Registrations active for campus students", date: "13/04/2026", icon: "📢", category: "Announcement" },
  { id: 2, text: "Annual Cultural Fest 2026: Stage allocations & band lineups published", date: "20/06/2026", icon: "🔥", category: "Fest Update" },
  { id: 3, text: "Campus Innovation Hackathon 2026: Final prize pool bumped to ₹1.5 Lakhs", date: "20/06/2026", icon: "🚀", category: "Hackathon" },
  { id: 4, text: "Generative AI & LLM Workshop: Hands-on API keys provided to attendees", date: "02/07/2026", icon: "💡", category: "Workshop" }
];

export default function LiveFeed() {
  const [mounted, setMounted] = useState(false);
  const [bulletins, setBulletins] = useState(INITIAL_BULLETINS);
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const filteredBulletins = bulletins.filter(
    (b) => filterCategory === "All" || b.category === filterCategory
  );

  return (
    <section id="live-feed" className="relative w-full py-20 overflow-hidden bg-primary transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-3 block">
            LIVE BROADCAST FEED
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-text-primary mb-4 tracking-tight">
            Campus Broadcast Bulletins
          </h2>
          <p className="text-text-secondary text-sm md:text-base max-w-xl mx-auto">
            Real-time feed of official organizer updates, timeline announcements, and event logs.
          </p>
        </motion.div>

        {/* Terminal Window */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="w-full bg-[#0d0d10] border border-[#222228] rounded-2xl overflow-hidden shadow-2xl relative"
        >
          {/* Window Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222228] bg-white/[0.02]">
            <div className="flex items-center gap-3 text-xs font-mono text-text-secondary">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-gray-400 font-semibold ml-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                LIVE_BULLETINS.LOG
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Category Filter Pills */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono">
                {["All", "Announcement", "Fest Update", "Hackathon", "Workshop"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                      filterCategory === cat
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 pl-2 border-l border-[#222228]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest hidden sm:inline">STREAMING</span>
              </div>
            </div>
          </div>

          {/* Window Body */}
          <div className="p-4 md:p-6 flex flex-col gap-3 font-mono text-xs md:text-sm min-h-[220px] justify-start">
            {mounted && filteredBulletins.length > 0 ? (
              filteredBulletins.map((bulletin, i) => (
                <motion.div 
                  key={bulletin.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#1c1c22] last:border-0 last:pb-0 group hover:bg-white/[0.02] p-2.5 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="text-emerald-400 font-bold select-none">&gt;_</span>
                    <span className="text-text-primary leading-relaxed">
                      <span className="mr-2">{bulletin.icon}</span>
                      {bulletin.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-gray-400 border border-white/[0.05]">
                      {bulletin.category}
                    </span>
                    <span className="text-gray-500 whitespace-nowrap text-xs">{bulletin.date}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              /* Fallback State Indicator */
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                <Radio className="w-8 h-8 text-gray-500 animate-pulse" />
                <p className="text-gray-400 text-xs font-mono">
                  No active announcements or broadcast logs right now for category &quot;{filterCategory}&quot;.
                </p>
                <button
                  onClick={() => setFilterCategory("All")}
                  className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Reset category filter
                </button>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </section>
  );
}

