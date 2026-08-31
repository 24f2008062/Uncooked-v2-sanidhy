"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Minus, Send, Sparkles, X, MessageSquare, Bot } from "lucide-react";
import Image from "next/image";

const ASSISTANT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop";

const QUICK_ACTIONS = [
  "Host an Event",
  "Explore Communities",
  "QR Check in System",
  "Ticketing & Pricing",
  "Hackathons & Fests",
  "Book a 15 Min Demo",
];

export default function AgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isCalling, setIsCalling] = useState(false);

  const handleSend = useCallback((textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const msgId = Date.now();
    const userMsg = { id: msgId, sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Simulate AI response
    setTimeout(() => {
      let reply = "Thanks for reaching out! Uncooked makes campus event management effortless with zero noise, instant QR passes, and real-time telemetry.";
      if (text.includes("Host") || text.includes("Event")) {
        reply = "You can create your event in under 2 minutes! Just click 'Get Started' in the navigation bar to launch your first event dashboard.";
      } else if (text.includes("QR") || text.includes("Check in")) {
        reply = "Our QR check in operates at 100+ scans per minute with offline caching so your venue lines never get backed up.";
      } else if (text.includes("Communities")) {
        reply = "Explore over 120+ active student tech clubs, run clubs, and cultural communities across campuses!";
      } else if (text.includes("Demo") || text.includes("Book")) {
        reply = "Awesome! We'd love to show you a live demo. Our campus team will connect with you shortly.";
      }

      setMessages((prev) => [
        ...prev,
        { id: msgId + 1, sender: "bot", text: reply },
      ]);
    }, 700);
  }, [inputText]);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {/* Expanded Agent Window */}
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-[90vw] max-w-[370px] sm:w-[380px] bg-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl"
            style={{
              boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(249, 115, 22, 0.15)",
            }}
          >
            {/* Top Bar Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-background/80">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-border-subtle">
                  <Image
                    src={ASSISTANT_AVATAR}
                    alt="Aura Avatar"
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary leading-none flex items-center gap-1.5">
                    Aura
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/10 text-[var(--accent-orange)]">
                      AI Assistant
                    </span>
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">Uncooked Virtual Guide</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsCalling(!isCalling)}
                  className={`p-2 rounded-xl border transition-colors ${
                    isCalling 
                      ? "bg-emerald-500 text-white border-emerald-400 animate-pulse" 
                      : "bg-white/5 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-white/10"
                  }`}
                  title="Call Assistant"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-white/5 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
                  title="Minimize"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Call Overlay Banner if active */}
            {isCalling && (
              <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-xs text-emerald-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Voice Call Active with Aura...
                </span>
                <button 
                  onClick={() => setIsCalling(false)}
                  className="underline text-emerald-300 hover:text-white"
                >
                  End
                </button>
              </div>
            )}

            {/* Content Area */}
            <div className="p-5 flex-grow overflow-y-auto max-h-[380px] min-h-[320px] flex flex-col justify-between space-y-4 bg-background/40">
              {messages.length === 0 ? (
                /* Initial Welcome View matching image 2 */
                <div className="flex flex-col items-center text-center my-auto py-2 space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent-orange)] shadow-lg relative">
                      <Image
                        src={ASSISTANT_AVATAR}
                        alt="Aura"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-text-primary">
                      Hi, I&apos;m Aura.
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      How can I help you with Uncooked today?
                    </p>
                  </div>

                  {/* Quick Action Pill Buttons matching screenshot */}
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(action)}
                        className="text-[12px] font-semibold px-3 py-1.5 rounded-full bg-zinc-900 text-zinc-100 hover:bg-[var(--accent-orange)] hover:text-white transition-all border border-zinc-700/60 shadow-sm active:scale-95 cursor-pointer"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chat Conversation Messages */
                <div className="space-y-3 py-2 flex flex-col">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-[var(--accent-orange)] text-white rounded-br-none font-medium"
                            : "bg-card border border-border-subtle text-text-primary rounded-bl-none shadow-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Input Area */}
            <div className="p-3 border-t border-border-subtle bg-background/90 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Send a message..."
                className="flex-grow bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-xs rounded-full px-4 py-2.5 border border-zinc-800 focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
              />
              <button
                onClick={() => handleSend()}
                className="w-9 h-9 rounded-full bg-amber-200/90 text-zinc-900 hover:bg-[var(--accent-orange)] hover:text-white flex items-center justify-center transition-all shrink-0 shadow-md active:scale-95"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* Floating Circular Trigger Button matching image 1 */
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center group cursor-pointer"
            onClick={() => setIsOpen(true)}
          >
            <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[var(--accent-orange)] via-amber-400 to-orange-600 shadow-2xl group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full overflow-hidden relative border-2 border-background">
                <Image
                  src={ASSISTANT_AVATAR}
                  alt="Aura AI Agent"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Online Green Indicator Dot */}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-md" />
            </div>

            {/* Name Badge matching screenshot */}
            <div className="mt-1 bg-white text-zinc-900 text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full shadow-md border border-zinc-200 uppercase">
              AURA
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
