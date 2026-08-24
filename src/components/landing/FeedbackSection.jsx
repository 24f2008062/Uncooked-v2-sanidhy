"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import ScrollVelocity from "@/components/ui/ScrollVelocity";
import Image from "next/image";

const REVIEWS = [
  {
    author: "Aarav Sharma",
    role: "Head of Tech Council",
    text: '"Uncooked helped us deliver our annual hackathon seamlessly and stayed supportive even after launch. That reliability made a real difference for us."',
    avatar: "https://ui-avatars.com/api/?name=Aarav+Sharma&background=f97316&color=fff",
  },
  {
    author: "Priya Patel",
    role: "Cultural Secretary",
    text: '"We\'ve worked with Uncooked across multiple college fests. They\'re reliable, detail-focused, and easy to work with from planning through delivery."',
    avatar: "https://ui-avatars.com/api/?name=Priya+Patel&background=a855f7&color=fff",
  },
  {
    author: "Rohan Desai",
    role: "Founder, Startup Cell",
    text: '"Before Uncooked, too much of our process lived in scattered tools and manual follow ups. They helped us turn that into a much cleaner system."',
    avatar: "https://ui-avatars.com/api/?name=Rohan+Desai&background=ec4899&color=fff",
  },
  {
    author: "Ananya Singh",
    role: "Event Coordinator",
    text: '"The platform is incredibly quick to respond, efficient, and genuinely helpful. They went above and beyond for our campus events."',
    avatar: "https://ui-avatars.com/api/?name=Ananya+Singh&background=3b82f6&color=fff",
  },
  {
    author: "Vikram Mehta",
    role: "Sports Committee",
    text: '"Uncooked helped us improve the way our inter college sports tournaments were managed behind the scenes. The participant experience felt much smoother."',
    avatar: "https://ui-avatars.com/api/?name=Vikram+Mehta&background=10b981&color=fff",
  },
];

export default function FeedbackSection() {
  const reviewCards = (
    <div className="flex gap-6 px-3 py-4">
      {REVIEWS.map((review, i) => (
        <div 
          key={i}
          className="bg-card border border-border-subtle rounded-2xl p-6 md:p-8 flex flex-col h-[280px] w-[320px] md:w-[380px] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group mx-3 shrink-0 relative overflow-hidden whitespace-normal"
        >
          {/* Faint Quote Mark */}
          <div className="absolute top-4 right-6 opacity-[0.03] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.06]">
            <Quote size={80} fill="currentColor" className="text-text-primary" />
          </div>

          <p className="text-text-secondary text-[15px] leading-relaxed italic mb-6 flex-grow relative z-10">
            {review.text}
          </p>
          
          <div className="flex items-center gap-4 mt-auto relative z-10">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-border-subtle group-hover:border-[var(--accent-orange)] transition-colors">
              <Image 
                src={review.avatar} 
                alt={review.author}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-text-primary leading-tight">{review.author}</span>
              <span className="text-[13px] font-medium" style={{ color: "var(--accent-orange)" }}>{review.role}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section id="feedback-section" className="relative w-full pt-16 pb-24 overflow-hidden bg-primary transition-colors duration-300">
      
      <div className="relative z-10 w-full flex flex-col">
        <div className="mb-12 px-4 md:px-8 xl:px-12 max-w-[1400px] mx-auto w-full">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "var(--accent-orange)" }}>
            CLIENT SUCCESS
          </h3>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary max-w-2xl leading-tight">
            What campus organizers say about <br className="hidden md:block"/>
            <span className="text-text-muted font-medium">Uncooked.</span>
          </h2>
        </div>

        {/* ScrollVelocity Marquee */}
        <div className="w-[100vw] -ml-[50vw] left-1/2 relative">
          <ScrollVelocity 
            texts={[reviewCards]} 
            velocity={25} 
            className="flex items-center"
            numCopies={3}
          />
        </div>
      </div>
    </section>
  );
}
