"use client";

import { motion } from "framer-motion";
import { Terminal, Bell } from "lucide-react";
import { useEffect, useState } from "react";

const BULETINS = [
  { text: "Career Counselling Festival: Registrations active for campus students", date: "13/04/2026", icon: "📢" },
  { text: "Annual Cultural Fest 2026: Registrations active for campus students", date: "20/06/2026", icon: "📢" },
  { text: "Campus Innovation Hackathon 2026: Registrations active for campus students", date: "20/06/2026", icon: "📢" },
  { text: "Generative AI & LLM Workshop: Registrations active for campus students", date: "02/07/2026", icon: "📢" }
];

export default function LiveFeed() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="live-feed" className="relative w-full py-16 overflow-hidden bg-primary transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs font-bold tracking-widest text-green-400 uppercase mb-3 block">Live Feed</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 tracking-tight">Campus Broadcast Bulletins</h2>
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
          className="w-full bg-secondary border border-border-subtle rounded-xl overflow-hidden shadow-2xl relative"
        >
          {/* Window Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
              <Bell className="w-3.5 h-3.5" />
              <span>LIVE_BULLETINS.LOG</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>

          {/* Window Body */}
          <div className="p-4 md:p-6 flex flex-col gap-4 font-mono text-xs md:text-sm">
            {mounted && BULETINS.map((bulletin, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border-subtle last:border-0 last:pb-0 group hover:bg-white/[0.02] p-2 -mx-2 rounded transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-text-secondary select-none">&gt;_</span>
                  <span className="text-text-primary">
                    <span className="mr-2">{bulletin.icon}</span>
                    {bulletin.text}
                  </span>
                </div>
                <span className="text-gray-500 whitespace-nowrap">{bulletin.date}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
