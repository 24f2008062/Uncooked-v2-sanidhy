"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AgentWidget from "@/components/ui/AgentWidget";
import Link from "next/link";
import { 
  Search, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Send,
  Building,
  Filter,
  Plus
} from "lucide-react";

const OPPORTUNITIES = [
  {
    id: "social-media-intern",
    title: "Social Media Marketing Intern",
    company: "Uncooked",
    type: "Internship",
    pay: "$ TBD",
    location: "Remote",
    desc: "Help us grow Uncooked across campus social media and student community channels. You will be building viral content and host spotlights.",
    skills: ["Social Media Management", "Content Creation", "Community Engagement"],
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    id: "frontend-dev-intern",
    title: "Frontend Developer Intern",
    company: "NeonTech Labs",
    type: "Internship",
    pay: "$20/hr",
    location: "Remote",
    desc: "Join our core frontend team to build next-gen interactive React and Next.js applications with smooth micro-animations.",
    skills: ["React", "Next.js", "Tailwind"],
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    id: "backend-eng-intern",
    title: "Backend Engineering Intern",
    company: "CloudScale Inc",
    type: "Internship",
    pay: "$25/hr",
    location: "Hybrid",
    desc: "Help scale our Go microservices handling millions of concurrent telemetry requests daily across campus nodes.",
    skills: ["Go", "Kubernetes", "AWS"],
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    id: "uiux-design-freelance",
    title: "UI/UX Design Freelance",
    company: "Creative Studios",
    type: "Freelance",
    pay: "$40/hr",
    location: "Hybrid",
    desc: "Design a high-converting landing page and onboarding flow for a new consumer app with glassmorphic aesthetic.",
    skills: ["Figma", "Prototyping", "User Research"],
    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  {
    id: "ai-agent-bounty",
    title: "AI Agent Developer Bounty",
    company: "DeepMind Campus Lab",
    type: "Bounty",
    pay: "$750 Bounty",
    location: "Remote",
    desc: "Build an autonomous AI subagent plugin for automated calendar synchronization and live attendee notifications.",
    skills: ["Python", "LangChain", "OpenAI API"],
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    id: "campus-growth-lead",
    title: "Campus Growth Lead",
    company: "Uncooked Ecosystem",
    type: "Full Time",
    pay: "$30/hr",
    location: "On Campus",
    desc: "Lead event partnerships, ambassador networks, and host verification across 25+ university campuses.",
    skills: ["Community Building", "Event Logistics", "Outreach"],
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
];

const CATEGORIES = ["All", "Internship", "Freelance", "Full Time", "Bounty"];

export default function OpportunitiesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [applicantData, setApplicantData] = useState({ name: "", email: "", portfolio: "", note: "" });
  const [isApplied, setIsApplied] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [listings, setListings] = useState(OPPORTUNITIES);

  const filteredOpportunities = listings.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.type.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.company.toLowerCase().includes(query) ||
      (item.skills || []).some((skill) => skill.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    fetch("/api/opportunities")
      .then((res) => res.json())
      .then((payload) => {
        const rows = payload.data?.opportunities || [];
        if (rows.length) {
          setListings(
            rows.map((row) => ({
              id: row.id,
              title: row.title,
              company: row.company,
              type: row.type,
              pay: row.stipend || "Undisclosed",
              location: row.location,
              desc: row.description,
              skills: [],
              badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError("");
    const res = await fetch(`/api/opportunities/${activeModalItem.id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coverNote: applicantData.note,
        resumeUrl: applicantData.portfolio,
      }),
    });
    const payload = await res.json();
    if (res.status === 401) {
      router.push("/login?redirectTo=/opportunities");
      return;
    }
    if (!res.ok) {
      setApplyError(payload.error?.message || "Could not submit application");
      return;
    }
    setIsApplied(true);
  };

  return (
    <>
      <Navbar forceDarkTop={true} />
      <AgentWidget />

      <main className="min-h-screen bg-primary transition-colors duration-300 pt-28 pb-24 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary mb-3 text-center"
            >
              Work Opportunities
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-sm sm:text-base max-w-3xl leading-relaxed mx-auto text-center"
            >
              Discover internships, freelance gigs, full-time roles, and bounties posted directly by our tech partners and campus startups.
            </motion.p>
          </div>

          {/* Search & Category Filter Controls Bar */}
          <div className="bg-card border border-border-subtle rounded-2xl p-4 sm:p-5 mb-10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            {/* Search Input */}
            <div className="relative w-full md:w-[420px]">
              <Search className="w-4 h-4 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles, skills, or companies..."
                className="w-full bg-background border border-border-subtle rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-start md:justify-end">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                        : "bg-background text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-hover"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opportunity Cards Grid (Matching screenshot layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredOpportunities.length === 0 ? (
              <div className="col-span-full py-16 text-center text-text-secondary">
                No opportunities found matching your search.
              </div>
            ) : (
              filteredOpportunities.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bg-card border border-border-subtle rounded-2xl p-6 flex flex-col justify-between hover:border-border-hover transition-all duration-300 shadow-md group hover:-translate-y-1"
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
                    <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-[var(--accent-orange)] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs font-medium text-text-secondary mb-3">
                      {item.company}
                    </p>

                    {/* Location Badge */}
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-4">
                      <MapPin className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
                      <span>{item.location}</span>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-text-secondary leading-relaxed mb-6 line-clamp-3">
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
                  <button
                    onClick={() => {
                      setActiveModalItem(item);
                      setIsApplied(false);
                      setApplicantData({ name: "", email: "", portfolio: "", note: "" });
                    }}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-background text-text-primary border border-border-subtle hover:bg-border-subtle transition-all duration-200 flex items-center justify-center gap-2 group-hover:border-[var(--accent-orange)] cursor-pointer"
                  >
                    <span>Apply Now</span>
                    <ExternalLink className="w-3.5 h-3.5 text-text-secondary group-hover:text-[var(--accent-orange)] transition-colors" />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* Hiring CTA Banner */}
          <div className="bg-card border border-border-subtle rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-orange)]">
                FOR STARTUPS & CLUB LEADS
              </span>
              <h3 className="text-2xl font-bold text-text-primary mt-1">
                Hiring for your campus startup or club?
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Post internships and bounties for students on Uncooked. Posting requires a verified organiser account.
              </p>
            </div>

            <Link
              href="/contact"
              className="px-8 py-3.5 rounded-full font-bold text-xs text-white shadow-lg shrink-0 transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
                boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.35)",
              }}
            >
              Post an Opportunity ↗
            </Link>
          </div>

        </div>
      </main>

      {/* Interactive Application Modal */}
      <AnimatePresence>
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalItem(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
            >
              <button
                onClick={() => setActiveModalItem(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-background text-text-secondary hover:text-text-primary border border-border-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {isApplied ? (
                /* Success State */
                <div className="py-8 text-center flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary">
                    Application Submitted!
                  </h3>
                  <p className="text-xs text-text-secondary max-w-sm">
                    Your application for <span className="text-text-primary font-semibold">{activeModalItem.title}</span> at {activeModalItem.company} has been sent directly to the hiring team.
                  </p>
                  <button
                    onClick={() => setActiveModalItem(null)}
                    className="mt-4 px-6 py-2.5 rounded-full text-xs font-bold bg-[var(--accent-orange)] text-white shadow-md hover:opacity-90 transition-opacity"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Application Form */
                <div>
                  <div className="mb-6">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {activeModalItem.type}
                    </span>
                    <h3 className="text-xl font-bold text-text-primary mt-2">
                      Apply for {activeModalItem.title}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {activeModalItem.company} • {activeModalItem.location} • <span className="text-emerald-400 font-semibold">{activeModalItem.pay}</span>
                    </p>
                  </div>

                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    {applyError && <p className="text-xs text-red-400">{applyError}</p>}
                    <p className="text-xs text-gray-400">Applications are attached to your signed-in account.</p>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={applicantData.name}
                        onChange={(e) => setApplicantData({ ...applicantData, name: e.target.value })}
                        placeholder="Alex Rivera"
                        className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Campus Email (.edu)
                      </label>
                      <input
                        type="email"
                        required
                        value={applicantData.email}
                        onChange={(e) => setApplicantData({ ...applicantData, email: e.target.value })}
                        placeholder="alex@campus.edu"
                        className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        GitHub / Portfolio URL
                      </label>
                      <input
                        type="url"
                        value={applicantData.portfolio}
                        onChange={(e) => setApplicantData({ ...applicantData, portfolio: e.target.value })}
                        placeholder="https://github.com/alexrivera"
                        className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Why are you a fit for this role?
                      </label>
                      <textarea
                        rows={3}
                        value={applicantData.note}
                        onChange={(e) => setApplicantData({ ...applicantData, note: e.target.value })}
                        placeholder="Briefly describe your relevant experience or projects..."
                        className="w-full bg-background border border-border-subtle rounded-xl p-3 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer mt-2"
                      style={{
                        background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
                        boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.35)",
                      }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Application
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
