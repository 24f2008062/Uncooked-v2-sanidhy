"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase, MapPin, ExternalLink, ArrowRight, Sparkles, Code2, ShieldCheck, Layers } from "lucide-react";

const FEATURED_OPPORTUNITIES = [
  {
    id: "frontend-dev-intern",
    title: "Frontend Developer Intern",
    company: "NeonTech Labs",
    type: "Internship",
    pay: "₹20,000 / mo",
    location: "Remote",
    desc: "Join our core frontend team to build next-gen interactive React and Next.js applications with smooth micro-animations.",
    skills: ["React", "Next.js", "Tailwind"],
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    buttonText: "Apply Now",
    icon: Code2,
  },
  {
    id: "smart-contract-bounty",
    title: "Smart Contract Auditing Bounty",
    company: "DeFi Protocols",
    type: "Bounty",
    pay: "₹50,000 – ₹1.5L",
    location: "Remote",
    desc: "Audit smart contracts for automated vault yield protocols and identify gas optimization paths before mainnet launch.",
    skills: ["Solidity", "Security", "Web3"],
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    buttonText: "Claim Bounty",
    icon: ShieldCheck,
  },
  {
    id: "fullstack-tech-lead",
    title: "Full-Stack Tech Lead",
    company: "Campus Venture Studio",
    type: "Freelance",
    pay: "₹50,000 / project",
    location: "Lucknow / Hybrid",
    desc: "Lead the full-stack architecture and backend database integration for our incubation studio's flag-ship student portal.",
    skills: ["Node.js", "Prisma", "PostgreSQL"],
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    buttonText: "Apply Now",
    icon: Layers,
  },
];

export default function CareerCatalyst() {
  return (
    <section id="career-catalyst" className="relative w-full py-20 overflow-hidden bg-primary transition-colors duration-300">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-500/5 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 xl:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-bold tracking-[0.2em] uppercase mb-3 block text-purple-400"
            >
              Career Catalyst
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary leading-tight"
            >
              Exclusive Work Opportunities
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-text-secondary text-sm md:text-base max-w-2xl mt-3 leading-relaxed"
            >
              Access curated internships, high-paying freelance gigs, and project bounties directly from top tech partners and campus ventures.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-orange)] hover:underline group"
            >
              <span>View all opportunities</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Opportunity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_OPPORTUNITIES.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-card border border-border-subtle rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--accent-orange)] transition-all duration-300 shadow-xl group hover:-translate-y-1 relative overflow-hidden"
              >
                <div>
                  {/* Top Row: Type Badge & Pay */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${item.badgeColor}`}>
                      {item.type}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">
                      {item.pay}
                    </span>
                  </div>

                  {/* Role Title & Company */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-background border border-border-subtle shrink-0 group-hover:border-[var(--accent-orange)] transition-colors">
                      <IconComponent className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary group-hover:text-[var(--accent-orange)] transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs font-medium text-text-secondary mt-0.5">
                        {item.company}
                      </p>
                    </div>
                  </div>

                  {/* Location Badge */}
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-4 mt-3">
                    <MapPin className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
                    <span>{item.location}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-relaxed mb-6">
                    {item.desc}
                  </p>

                  {/* Skill Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {item.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-background text-text-secondary border border-border-subtle"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Apply Action Button */}
                <Link
                  href="/opportunities"
                  className="w-full py-3 rounded-xl font-bold text-xs bg-background text-text-primary border border-border-subtle hover:bg-border-subtle transition-all duration-200 flex items-center justify-center gap-2 group-hover:border-[var(--accent-orange)] cursor-pointer"
                >
                  <span>{item.buttonText}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-text-secondary group-hover:text-[var(--accent-orange)] transition-colors" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
