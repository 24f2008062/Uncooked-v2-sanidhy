"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AgentWidget from "@/components/ui/AgentWidget";
import { 
  Mail, 
  MessageSquare, 
  Building2, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  Clock, 
  ShieldCheck,
  Sparkles
} from "lucide-react";

const SUPPORT_CHANNELS = [
  {
    icon: <Mail className="w-5 h-5 text-orange-500" />,
    title: "Official Support & Inquiries",
    email: "support@uncooked.in",
    sub: "Direct channel for hosts, event ticketing, campus partnerships, and technical help.",
  },
];

const FAQS = [
  {
    q: "How do I verify my campus club or student society?",
    a: "Verification takes under 5 minutes! Simply register with your official campus (.edu) email or upload your club charter from your university portal.",
  },
  {
    q: "Is Uncooked free for student organizations?",
    a: "Yes! Uncooked is 100% free for all free campus events, workshops, and club meetups. For paid ticketed events, we charge a minimal fee to cover payment processing.",
  },
  {
    q: "How does the offline QR check in feature work?",
    a: "Our check in app caches attendee ticket signatures locally on your device. Even if your venue loses Wi-Fi or cellular signal, check ins remain 100% operational.",
  },
  {
    q: "Can we integrate Uncooked with our university website?",
    a: "Absoluty! We provide embeddable event widgets and developer APIs to showcase your upcoming events directly on your student portal.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "Host Verification",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload = await res.json();
      if (!res.ok) {
        setSubmitError(payload.error?.message || "Could not send message");
        return;
      }
      setIsSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar forceDarkTop={true} />
      <AgentWidget />

      <main className="min-h-screen bg-primary transition-colors duration-300 pt-28 pb-24 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-20 right-1/4 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary mb-4"
            >
              Let&apos;s Talk Campus Infrastructure.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-base sm:text-lg leading-relaxed"
            >
              Have questions about hosting, club verification, or enterprise university partnerships? Our team is online and ready to assist.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
            
            {/* Left Side: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-7 bg-card border border-border-subtle rounded-3xl p-6 sm:p-10 shadow-xl"
            >
              {isSubmitted ? (
                <div className="py-16 text-center flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-sm text-text-secondary max-w-md">
                    Thank you for contacting Uncooked. We stored your message and will reply to <span className="text-text-primary font-medium">{formData.email}</span>. We do not guarantee a two-hour SLA.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: "", email: "", category: "Host Verification", message: "" });
                    }}
                    className="mt-4 px-6 py-2.5 rounded-full text-xs font-bold bg-background text-text-primary border border-border-subtle hover:border-[var(--accent-orange)] transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {submitError && <p className="text-xs text-red-400">{submitError}</p>}
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Alex Rivera"
                      className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Campus / Organization Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@campus.edu"
                      className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Topic / Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--accent-orange)] transition-colors cursor-pointer"
                    >
                      <option value="Host Verification">Host & Club Verification</option>
                      <option value="Event Ticketing">Event Ticketing & Passes</option>
                      <option value="Campus Partnership">University & Campus Alliance</option>
                      <option value="Technical Support">Technical Support & Telemetry</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                      How can we help?
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your campus event, club needs, or technical question..."
                      className="w-full bg-background border border-border-subtle rounded-xl p-4 text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-[var(--accent-orange)] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
                      boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.35)",
                    }}
                  >
                    <Send className="w-4 h-4" />
                    Submit Message
                  </button>
                </form>
              )}
            </motion.div>

            {/* Right Side: Channels & Guarantees */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-5 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary mb-4">
                  Direct Support Channels
                </h3>

                {SUPPORT_CHANNELS.map((channel, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-card border border-border-subtle flex items-start gap-4 hover:border-border-hover transition-colors"
                  >
                    <div className="p-3 rounded-xl bg-background border border-border-subtle shrink-0">
                      {channel.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {channel.title}
                      </h4>
                      <p className="text-xs font-semibold text-[var(--accent-orange)] my-0.5">
                        {channel.email}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {channel.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* SLA Response Guarantee Box */}
              <div className="p-6 rounded-2xl bg-card/60 border border-border-subtle flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    Fast SLA Response Guarantee
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Event day emergency support is active 24/7 for verified campus hosts.
                  </p>
                </div>
              </div>

            </motion.div>

          </div>

          {/* FAQ Accordion Section */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent-orange)] mb-2">
                FREQUENTLY ASKED QUESTIONS
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Got Questions? We&apos;ve Got Answers.
              </h3>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, i) => {
                const isOpen = activeFaq === i;
                return (
                  <div
                    key={i}
                    className="bg-card border border-border-subtle rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : i)}
                      className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-text-primary hover:text-[var(--accent-orange)] transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-text-secondary transition-transform duration-300 shrink-0 ${
                          isOpen ? "rotate-180 text-[var(--accent-orange)]" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="px-5 pb-5 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border-subtle/50 pt-3"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
