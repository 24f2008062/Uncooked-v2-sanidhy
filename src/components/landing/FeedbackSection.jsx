"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, Send, CheckCircle2, MessageSquare, Sparkles, AlertCircle } from "lucide-react";
import Image from "next/image";

const INITIAL_REVIEWS = [
  {
    id: 1,
    author: "Aarav Sharma",
    role: "Head of Tech Council",
    event: "Hackathon 2026",
    rating: 5,
    text: "Uncooked helped us deliver our annual hackathon seamlessly and stayed supportive even after launch. That reliability made a real difference for us.",
    avatar: "https://ui-avatars.com/api/?name=Aarav+Sharma&background=f97316&color=fff",
    verified: true,
  },
  {
    id: 2,
    author: "Priya Patel",
    role: "Cultural Secretary",
    event: "Spandan Fest",
    rating: 5,
    text: "We've worked with Uncooked across multiple college fests. They're reliable, detail-focused, and easy to work with from planning through delivery.",
    avatar: "https://ui-avatars.com/api/?name=Priya+Patel&background=a855f7&color=fff",
    verified: true,
  },
  {
    id: 3,
    author: "Rohan Desai",
    role: "Founder, Startup Cell",
    event: "Pitch Night '26",
    rating: 4,
    text: "Before Uncooked, too much of our process lived in scattered tools and manual follow ups. They helped us turn that into a much cleaner system.",
    avatar: "https://ui-avatars.com/api/?name=Rohan+Desai&background=ec4899&color=fff",
    verified: true,
  },
  {
    id: 4,
    author: "Ananya Singh",
    role: "Event Coordinator",
    event: "GenAI Workshop",
    rating: 5,
    text: "The platform is incredibly quick to respond, efficient, and genuinely helpful. They went above and beyond for our campus events.",
    avatar: "https://ui-avatars.com/api/?name=Ananya+Singh&background=3b82f6&color=fff",
    verified: true,
  },
  {
    id: 5,
    author: "Vikram Mehta",
    role: "Sports Committee",
    event: "Inter-Campus League",
    rating: 5,
    text: "Uncooked helped us improve the way our inter college sports tournaments were managed behind the scenes. The participant experience felt much smoother.",
    avatar: "https://ui-avatars.com/api/?name=Vikram+Mehta&background=10b981&color=fff",
    verified: true,
  },
];

export default function FeedbackSection() {
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [roleEvent, setRoleEvent] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!authorName.trim() || !reviewText.trim()) return;

    const newReview = {
      id: Date.now(),
      author: authorName,
      role: roleEvent.trim() || "Campus Attendee",
      event: "Lucknow Network",
      rating: rating,
      text: reviewText,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=f97316&color=fff`,
      verified: true,
    };

    setReviews([newReview, ...reviews]);
    setAuthorName("");
    setRoleEvent("");
    setReviewText("");
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
    }, 4000);
  };

  const renderStars = (count, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? star <= (hoverRating || rating)
            : star <= count;
          return (
            <button
              key={star}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && setRating(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={interactive ? "cursor-pointer transition-transform hover:scale-110 p-0.5" : ""}
            >
              <Star
                className={`w-4 h-4 ${
                  isFilled
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-600 fill-transparent"
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <section id="feedback-section" className="relative w-full py-20 overflow-hidden bg-primary transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute top-10 right-10 w-[600px] h-[350px] bg-orange-500/5 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 xl:px-12">
        {/* Section Header */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-[0.2em] uppercase mb-3 block text-[var(--accent-orange)]"
          >
            ECOSYSTEM FEEDBACK
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary leading-tight mb-4"
          >
            Attended an event? <span className="text-[var(--accent-orange)]">Share your thoughts raw.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-text-secondary text-sm md:text-base max-w-xl mx-auto"
          >
            Honest reviews from students, organizers, and attendee networks across Lucknow campuses.
          </motion.p>
        </div>

        {/* Grid: Form on Left, Verified Logs on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Submission Form Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 bg-card border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-[var(--accent-orange)]" />
              <h3 className="text-lg font-bold text-text-primary">Submit Your Feedback</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Select */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Rating
                </label>
                {renderStars(rating, true)}
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Your Name / Handle
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Samarth Verma"
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                />
              </div>

              {/* Role / Event Input */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Role / Campus Event (Optional)
                </label>
                <input
                  type="text"
                  value={roleEvent}
                  onChange={(e) => setRoleEvent(e.target.value)}
                  placeholder="e.g. Lead, Hackathon 2026"
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                />
              </div>

              {/* Review Textarea */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Raw Review / Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your raw review or experience about the event and platform..."
                  className="w-full bg-background border border-border-subtle rounded-xl p-3 text-xs sm:text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-[var(--accent-orange)] transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
                  boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.35)",
                }}
              >
                <Send className="w-3.5 h-3.5" />
                Submit Review
              </button>

              <AnimatePresence>
                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Review logged! Your feedback is now live on the campus stream.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Verified Attendee Logs Column */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Verified Attendee Logs ({reviews.length} entries)
                </span>
              </div>
              {reviews.length > 0 && (
                <button
                  onClick={() => setReviews([])}
                  className="text-[10px] text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear Feed
                </button>
              )}
            </div>

            {/* Reviews Stream / Cards */}
            {reviews.length > 0 ? (
              <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1 no-scrollbar">
                {reviews.map((rev) => (
                  <motion.div
                    key={rev.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border-subtle rounded-2xl p-5 shadow-md hover:border-border-hover transition-all duration-200 group relative"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border-subtle shrink-0">
                          <Image
                            src={rev.avatar}
                            alt={rev.author}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-text-primary leading-none">
                              {rev.author}
                            </span>
                            {rev.verified && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                                Verified
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-text-secondary block mt-0.5">
                            {rev.role}
                          </span>
                        </div>
                      </div>
                      {renderStars(rev.rating)}
                    </div>

                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed italic">
                      &quot;{rev.text}&quot;
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Fallback State Indicator */
              <div className="bg-card border border-border-subtle border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                <AlertCircle className="w-8 h-8 text-gray-500" />
                <p className="text-text-secondary text-xs sm:text-sm max-w-sm">
                  No active logs. Submit yours to initialize the feed.
                </p>
                <button
                  onClick={() => setReviews(INITIAL_REVIEWS)}
                  className="text-xs font-bold text-[var(--accent-orange)] hover:underline cursor-pointer"
                >
                  Restore sample logs
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

