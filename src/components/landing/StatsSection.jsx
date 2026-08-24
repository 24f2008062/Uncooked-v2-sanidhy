"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Users, Calendar, CheckCircle } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

function AnimatedCounter({ value }) {
  const numValue = parseInt(value.replace(/,/g, ''), 10);
  const count = useMotionValue(0);
  
  const { theme } = useTheme();
  const finalColor = theme === "light" ? "#09090b" : "#ffffff";
  
  // Transition color: vibrant orange -> purple -> text-primary
  const color = useTransform(
    count, 
    [0, numValue * 0.5, numValue], 
    ["#f97316", "#a855f7", finalColor]
  );
  
  const rounded = useTransform(count, (latest) => {
    return Math.round(latest).toLocaleString();
  });
  
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate(count, numValue, { duration: 2.5, ease: "easeOut" });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [count, numValue]);

  return <motion.span ref={ref} style={{ color }}>{rounded}</motion.span>;
}

const stats = [
  {
    title: "STUDENTS REGISTERED",
    value: "7,645",
    subtitle: "Verified campus students",
    icon: Users,
  },
  {
    title: "ACTIVE EVENTS",
    value: "8",
    subtitle: "Upcoming fests, workshops & hackathons",
    icon: Calendar,
  },
  {
    title: "TOTAL REGISTRATIONS",
    value: "3,500",
    subtitle: "Verified event registrations",
    icon: CheckCircle,
  }
];

const topStats = [
  { value: "3,500", label: "Registrations" },
  { value: "7,645", label: "Students Active" },
  { value: "8", label: "Campus Events" }
];

export default function StatsSection() {
  return (
    <section id="stats-section" className="relative w-full pt-20 pb-16 overflow-hidden bg-primary transition-colors duration-300">
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(to right, var(--text-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 xl:px-12 flex flex-col items-center">
        
        {/* Top Minimal Stats */}
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 mb-16 text-center">
          {topStats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center relative">
              <span className="text-xl md:text-2xl font-bold mb-1 font-mono">
                <AnimatedCounter value={stat.value} />
              </span>
              <span className="text-sm md:text-base text-text-secondary font-mono">{stat.label}</span>
              {i !== topStats.length - 1 && (
                <div className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 h-10 w-px bg-white/10" />
              )}
            </div>
          ))}
        </div>

        {/* Separator line with gradient fade */}
        <div className="w-[120%] -ml-[10%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mb-16" />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-secondary border border-border-subtle rounded-2xl p-6 md:p-8 flex flex-col hover:border-border-hover transition-colors shadow-2xl relative overflow-hidden group"
              >
                {/* Subtle gradient hover effect on card */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex justify-between items-start mb-10 relative z-10">
                  <h3 className="text-xs font-bold tracking-wider text-text-secondary/80 uppercase">{stat.title}</h3>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/[0.02]">
                    <Icon className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 relative z-10">
                  <span className="text-4xl md:text-5xl font-bold tracking-tight">
                    <AnimatedCounter value={stat.value} />
                  </span>
                  <span className="text-sm text-text-secondary">{stat.subtitle}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  );
}
