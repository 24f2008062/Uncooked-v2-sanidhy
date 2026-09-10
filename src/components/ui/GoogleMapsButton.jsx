"use client";

import { ExternalLink } from "lucide-react";

export function GoogleMapsIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Google Maps Pin */}
      <path
        d="M16 2C10.477 2 6 6.477 6 12C6 19.5 16 30 16 30C16 30 26 19.5 26 12C26 6.477 21.523 2 16 2Z"
        fill="#EA4335"
      />
      <path
        d="M16 17C18.7614 17 21 14.7614 21 12C21 9.23858 18.7614 7 16 7C13.2386 7 11 9.23858 11 12C11 14.7614 13.2386 17 16 17Z"
        fill="#FFFFFF"
      />
      <circle cx="16" cy="12" r="3" fill="#4285F4" />
    </svg>
  );
}

export function getGoogleMapsUrl(location, city = "", state = "") {
  if (!location || typeof location !== "string") {
    return "https://www.google.com/maps";
  }
  const trimmed = location.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    if (
      trimmed.includes("maps.google.") ||
      trimmed.includes("google.com/maps") ||
      trimmed.includes("maps.app.goo.gl") ||
      trimmed.includes("goo.gl/maps")
    ) {
      return trimmed;
    }
  }
  const query = [trimmed, city, state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function GoogleMapsButton({
  location,
  city = "",
  state = "",
  label = "Google Maps",
  variant = "button", // "button" | "badge" | "icon"
  className = "",
  onClick,
}) {
  const mapUrl = getGoogleMapsUrl(location, city, state);

  const handleClick = (e) => {
    if (onClick) onClick(e);
  };

  if (variant === "badge") {
    return (
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors ${className}`}
        title="Open in Google Maps"
      >
        <GoogleMapsIcon className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
      </a>
    );
  }

  if (variant === "icon") {
    return (
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors ${className}`}
        title="Open in Google Maps"
      >
        <GoogleMapsIcon className="w-4 h-4 shrink-0" />
      </a>
    );
  }

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all active:scale-98 cursor-pointer ${className}`}
      title="Open location on Google Maps"
    >
      <GoogleMapsIcon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 text-white/40" />
    </a>
  );
}

