"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const CreateEventView = dynamic(() => import("./CreateEventView"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading…
    </div>
  ),
});

export default function CreateEventModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const nav = document.getElementById("main-navbar");

    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (nav) {
        nav.style.display = "none";
      }
    } else {
      document.body.style.overflow = "unset";
      if (nav) {
        nav.style.display = "";
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      if (nav) {
        nav.style.display = "";
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] overflow-y-auto bg-[#0a0512] text-white selection:bg-pink-500/30"
          style={{ overscrollBehavior: "contain" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full min-h-screen"
          >
            <CreateEventView isModal={true} onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
