"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isIntersecting, setIsIntersecting] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const footerLinks = {
    product: [
      { label: "Events", href: "/events" },
      { label: "Opportunities", href: "/opportunities" },
      { label: "Host an Event", href: "/host" },
      { label: "Host application", href: "/host/apply" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    legal: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Security", href: "/security" },
      { label: "Cookies", href: "/cookies" },
    ],
  };

  const socialLinks = [
    {
      label: "Instagram",
      href: "#",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      label: "X",
      href: "#",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: "YouTube",
      href: "#",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  return (
    <footer
      className="relative"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Logo & Links */}
          <div className="flex items-center gap-6 flex-wrap">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--accent-orange)]" />
              <span
                className="text-xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                uncooked
              </span>
            </Link>
            {footerLinks.product.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-200"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  e.target.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "var(--text-muted)";
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="transition-colors duration-200"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div
          className="mt-8 pt-6 flex flex-wrap items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs transition-colors duration-200"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  e.target.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "var(--text-muted)";
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {currentYear} Uncooked Portal. All rights reserved.
          </p>
        </div>
      </div>

      {/* Massive Background Text Effect */}
      <div 
        ref={textRef}
        className="w-full overflow-hidden pointer-events-none mt-8 select-none grid"
        style={{ placeItems: "center" }}
      >
        {/* Base subtle dark text */}
        <span 
          className="font-black leading-none tracking-tighter col-start-1 row-start-1"
          style={{
            fontSize: "clamp(100px, 20vw, 300px)",
            background: "linear-gradient(to bottom, rgba(244,114,182,0.08) 0%, rgba(249,115,22,0.02) 50%, transparent 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: "translateY(20%)" // push it down slightly to cut it off at the bottom
          }}
        >
          UNCOOKED
        </span>
        {/* Glowing orange text on scroll */}
        <span 
          className="font-black leading-none tracking-tighter col-start-1 row-start-1 transition-opacity duration-[1500ms] ease-out"
          style={{
            fontSize: "clamp(100px, 20vw, 300px)",
            background: "linear-gradient(to bottom, var(--accent-orange) 0%, transparent 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: "translateY(20%)",
            opacity: isIntersecting ? 0.25 : 0
          }}
        >
          UNCOOKED
        </span>
      </div>
    </footer>
  );
}
