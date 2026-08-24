"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Calendar } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const popularEvents = [
  {
    id: "youtube-spotlight",
    title: "YouTube Spotlight Feat. Startups",
    image: "/events/hackathon.png",
    date: "Tomorrow, 6:00 pm",
    badge: "Trending",
    badgeColor: "#ef4444",
  },
  {
    id: "investor-month",
    title: "Investor of the Month featuring...",
    image: "/events/cocktail-hour.png",
    date: "Tomorrow, 3:00 pm",
    badge: null,
  },
  {
    id: "music-madverse",
    title: "All About Music X Madverse Music",
    image: "/events/music-fest.png",
    date: "Tomorrow, 8:00 pm",
    badge: "Hot",
    badgeColor: "#f97316",
  },
  {
    id: "oscar-browser",
    title: "How to Win an Oscar from Your...",
    image: "/events/workshop.png",
    date: "Saturday, 10:00 am",
    badge: null,
  },
  {
    id: "launchpad",
    title: "Launchpad Mumbai",
    image: "/events/ai-summit.png",
    date: "Saturday, 10:00 am",
    badge: "New",
    badgeColor: "#22c55e",
  },
  {
    id: "seekers-sunrise",
    title: "Seeker's Sunrise Mumbai",
    image: "/events/beach-party.png",
    date: "Sunday, 5:00 am",
    badge: null,
  },
];

export default function PopularEvents() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      checkScroll();
      // Recheck on resize
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(el);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        resizeObserver.disconnect();
      };
    }
  }, []);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="section-padding pt-0" id="popular-events">
      <div className="content-container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 text-[var(--accent-orange)] border border-orange-500/20 mb-3 shadow-sm">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">TRENDING ON CAMPUS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Upcoming Events
          </h2>
        </div>

        {/* Scrollable Cards */}
        <div className="relative">
          <div ref={scrollRef} className="scroll-carousel flex justify-start md:justify-center gap-4 sm:gap-6 overflow-x-auto pb-4 hide-scrollbar">
            {popularEvents.map((event, i) => (
              <Link key={event.id} href="/events">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group cursor-pointer flex-shrink-0"
                  style={{
                    width: "160px",
                  }}
                >
                  {/* Image */}
                  <div
                    className="relative w-full aspect-square overflow-hidden mb-3 rounded-2xl"
                    style={{
                      backgroundColor: "var(--bg-card)",
                    }}
                  >
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      sizes="160px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent 50%)",
                      }}
                    />
                  </div>

                  {/* Info */}
                  <h3
                    className="text-sm font-semibold leading-snug mb-1 line-clamp-2 text-text-primary group-hover:text-[var(--accent-orange)] transition-colors"
                  >
                    {event.title}
                  </h3>
                  <p
                    className="text-[13px] text-text-secondary"
                  >
                    {event.date}
                  </p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
