"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, CheckCircle2, X, Loader2, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

const STORAGE_KEY = "opportia_location_choice";
const COORDS_KEY = "opportia_user_location";

export default function LocationPrompt() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "requesting" | "granted" | "declined"
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user has already made a choice
    let storedChoice = null;
    try {
      storedChoice = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }

    // Defer prompt so it doesn't compete with first paint / login (esp. mobile).
    if (!storedChoice) {
      const isMobile =
        typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
      const delay = isMobile ? 4500 : 2500;
      let idleId = null;
      let timer = null;
      const open = () => setIsOpen(true);
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(open, { timeout: delay });
      } else {
        timer = setTimeout(open, delay);
      }
      return () => {
        if (idleId != null) window.cancelIdleCallback?.(idleId);
        if (timer) clearTimeout(timer);
      };
    }

    // Allow opening/toggling prompt programmatically from anywhere (e.g. settings or events)
    const handleOpenPrompt = () => {
      setStatus("idle");
      setErrorMessage("");
      setIsOpen(true);
    };

    window.addEventListener("opportia:open-location-prompt", handleOpenPrompt);
    return () => {
      window.removeEventListener("opportia:open-location-prompt", handleOpenPrompt);
    };
  }, []);

  const handleTurnOnLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setStatus("requesting");
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };

        try {
          window.localStorage.setItem(STORAGE_KEY, "granted");
          window.localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
          document.cookie = `opportia_loc=1; path=/; max-age=2592000; SameSite=Lax`;
        } catch {
          /* ignore */
        }

        // Notify app components that location has been enabled
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("opportia:location-changed", {
              detail: { status: "granted", coords },
            })
          );
        }

        setStatus("granted");

        // Automatically dismiss after success feedback
        setTimeout(() => {
          setIsOpen(false);
        }, 1800);
      },
      (err) => {
        // User denied or browser blocked permission
        try {
          window.localStorage.setItem(STORAGE_KEY, "declined");
          window.localStorage.removeItem(COORDS_KEY);
          document.cookie = `opportia_loc=0; path=/; max-age=2592000; SameSite=Lax`;
        } catch {
          /* ignore */
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("opportia:location-changed", {
              detail: { status: "declined" },
            })
          );
        }

        if (err.code === 1) {
          // User denied permission
          setStatus("declined");
          setErrorMessage(
            t(
              "location.denied",
              "Location access was denied in browser settings. You can re-enable it anytime."
            )
          );
        } else {
          setStatus("declined");
          setErrorMessage("Unable to determine location. You can try again later.");
        }

        setTimeout(() => {
          setIsOpen(false);
        }, 2200);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, [t]);

  const handleKeepOff = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "declined");
      window.localStorage.removeItem(COORDS_KEY);
      document.cookie = `opportia_loc=0; path=/; max-age=2592000; SameSite=Lax`;
    } catch {
      /* ignore */
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("opportia:location-changed", {
          detail: { status: "declined" },
        })
      );
    }

    setStatus("declined");
    setIsOpen(false);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[70] max-w-sm w-full mx-auto sm:mx-0 pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="pointer-events-auto rounded-3xl bg-card/95 backdrop-blur-2xl border border-border-hover shadow-2xl p-5 relative overflow-hidden"
        >
          {/* Subtle warm accent glow in background */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--accent-orange)]/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleKeepOff}
            className="absolute top-4 right-4 p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Dismiss location prompt"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header with animated icon */}
          <div className="flex items-start gap-3.5 pr-6">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 text-[var(--accent-orange)] shadow-inner">
              {status === "requesting" ? (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-orange)]" />
              ) : status === "granted" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                  </span>
                </>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-text-primary tracking-tight">
                {status === "granted"
                  ? "Location Turned On"
                  : status === "declined"
                  ? "Location Kept Off"
                  : t("location.title", "Turn on Location")}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {errorMessage
                  ? errorMessage
                  : status === "granted"
                  ? t("location.success", "Location enabled! Personalizing events near you.")
                  : status === "declined"
                  ? "Location kept off. You can change this anytime."
                  : t(
                      "location.subtitle",
                      "Discover campus events, student meetups, and hackathons happening near you."
                    )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {status === "idle" && (
            <div className="mt-4 pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleTurnOnLocation}
                className="flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-orange-400 to-amber-500 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>{t("location.turnOn", "Turn On Location")}</span>
              </button>

              <button
                type="button"
                onClick={handleKeepOff}
                className="py-2.5 px-3.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary bg-secondary hover:bg-card-hover border border-border-subtle transition-all cursor-pointer"
              >
                {t("location.keepOff", "Keep Off")}
              </button>
            </div>
          )}

          {status === "requesting" && (
            <div className="mt-4 pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-text-secondary py-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-orange)]" />
              <span>{t("location.requesting", "Detecting location...")}</span>
            </div>
          )}

          {/* Privacy footer */}
          <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex items-center gap-1.5 text-[10px] text-text-muted">
            <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>
              {t(
                "location.privacyNote",
                "Your location is only stored locally on your device."
              )}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
