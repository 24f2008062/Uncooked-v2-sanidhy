"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Send } from "lucide-react";
import Image from "next/image";
import { QUICK_ACTIONS, getAuraReply } from "@/components/ui/auraKnowledge";

const ASSISTANT_AVATAR =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop";

let messageSeq = 0;
function nextMessageId() {
  messageSeq += 1;
  return `aura-${messageSeq}`;
}

export default function AgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef(null);
  const replyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isTyping, isOpen]);

  const handleSend = useCallback(
    (textToSend) => {
      const text = String(textToSend ?? inputText).trim();
      if (!text || isTyping) return;

      const userMsg = { id: nextMessageId(), sender: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsTyping(true);

      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
      replyTimerRef.current = setTimeout(() => {
        const reply = getAuraReply(text);
        setMessages((prev) => [...prev, { id: nextMessageId(), sender: "bot", text: reply }]);
        setIsTyping(false);
        replyTimerRef.current = null;
      }, 450);
    },
    [inputText, isTyping]
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
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
            role="dialog"
            aria-label="Aura chat assistant"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-background/80">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-border-subtle">
                  <Image src={ASSISTANT_AVATAR} alt="Aura Avatar" fill className="object-cover" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary leading-none flex items-center gap-1.5">
                    Aura
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/10 text-[var(--accent-orange)]">
                      Guide
                    </span>
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">Chat only · Uncooked</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors inline-flex items-center justify-center"
                title="Minimize"
                aria-label="Minimize chat"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div
              ref={listRef}
              className="p-5 flex-grow overflow-y-auto max-h-[380px] min-h-[320px] flex flex-col bg-background/40"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center text-center my-auto py-2 space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent-orange)] shadow-lg relative">
                      <Image src={ASSISTANT_AVATAR} alt="Aura" fill className="object-cover" />
                    </div>
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-text-primary">Hi, I&apos;m Aura.</h3>
                    <p className="text-xs text-text-secondary mt-1 max-w-[260px]">
                      Campus events, passes, hosting, and privacy. Honest answers about what Uncooked actually does.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => handleSend(action)}
                        className="text-[12px] font-semibold px-3 py-2 min-h-[44px] rounded-full bg-zinc-900 text-zinc-100 hover:bg-[var(--accent-orange)] hover:text-white transition-all border border-zinc-700/60 shadow-sm active:scale-95 cursor-pointer"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-2 flex flex-col">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
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
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border-subtle text-text-secondary rounded-2xl rounded-bl-none px-3 py-2 text-[11px]">
                        Aura is typing…
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border-subtle bg-background/90 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about events, passes, hosting…"
                aria-label="Message Aura"
                className="flex-grow bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-xs rounded-full px-4 py-2.5 min-h-[44px] border border-zinc-800 focus:outline-none focus:border-[var(--accent-orange)] transition-colors"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isTyping || !inputText.trim()}
                className="w-11 h-11 rounded-full bg-amber-200/90 text-zinc-900 hover:bg-[var(--accent-orange)] hover:text-white flex items-center justify-center transition-all shrink-0 shadow-md active:scale-95 disabled:opacity-50"
                title="Send"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center group cursor-pointer bg-transparent border-0 p-0"
            onClick={() => setIsOpen(true)}
            aria-label="Open Aura chat"
          >
            <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[var(--accent-orange)] via-amber-400 to-orange-600 shadow-2xl group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full overflow-hidden relative border-2 border-background">
                <Image src={ASSISTANT_AVATAR} alt="" fill className="object-cover" />
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-md" />
            </div>
            <div className="mt-1 bg-white text-zinc-900 text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full shadow-md border border-zinc-200 uppercase">
              AURA
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
