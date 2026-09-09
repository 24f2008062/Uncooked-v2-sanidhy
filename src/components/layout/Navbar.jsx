"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SupabaseProvider";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Sparkles,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export const AVATAR_OPTIONS = [
  { id: "male", name: "Male", src: "/avatars/male.svg" },
  { id: "female", name: "Female", src: "/avatars/female.svg" },
  { id: "rockstar", name: "Rockstar", src: "/avatars/rockstar.svg" },
  { id: "astronaut", name: "Astronaut", src: "/avatars/astronaut.svg" },
  { id: "cyberpunk", name: "Cyberpunk", src: "/avatars/cyberpunk.svg" },
  { id: "exciting", name: "Exciting", src: "/avatars/exciting.svg" },
];

export default function Navbar({ forceDarkTop = false }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const supabase = createClient();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  // Avatar state with persistence
  const [selectedAvatarId, setSelectedAvatarId] = useState("male");
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_selected_avatar");
      if (saved && AVATAR_OPTIONS.some((a) => a.id === saved)) {
        setSelectedAvatarId(saved);
      }
    }
  }, []);

  const handleSelectAvatar = (id) => {
    setSelectedAvatarId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_selected_avatar", id);
    }
  };

  const activeAvatar =
    AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId) || AVATAR_OPTIONS[0];

  // Fetch full user profile details if logged in
  const isLoggedIn = status === "authenticated";
  const currentUser = session?.user;

  useEffect(() => {
    if (!isLoggedIn) return;
    let isSubscribed = true;

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (isSubscribed && data.data?.user) {
          setUserProfile(data.data.user);
        }
      } catch {
        // fallback to session info
      }
    };

    fetchProfile();
    return () => {
      isSubscribed = false;
    };
  }, [isLoggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("pointerdown", handleClickOutside);
    }
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [userDropdownOpen]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (currentScrollY > 80 && currentScrollY > lastScrollY) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileOpen((prev) => {
      const next = !prev;
      if (next) setVisible(true);
      return next;
    });
  };

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName =
    userProfile?.fullName ||
    userProfile?.name ||
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "Campus User";

  const userEmail =
    userProfile?.email ||
    currentUser?.email ||
    "";

  const navLinks = [
    { label: "Events", href: "/events" },
    { label: "Opportunities", href: "/opportunities" },
    { label: "Host an Event", href: "/host" },
    { label: "About", href: "/about" },
    { label: "Help", href: "/help" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ 
          y: visible ? 0 : -100, 
          opacity: visible ? 1 : 0 
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`navbar ${scrolled ? "scrolled" : ""} ${forceDarkTop ? "force-dark-top" : ""}`}
        id="main-navbar"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 z-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-[var(--accent-orange)]" />
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              OPPORTIA
            </span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                background: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              β
            </span>
          </motion.div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.target.style.color = "var(--text-primary)";
                e.target.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "var(--text-secondary)";
                e.target.style.background = "transparent";
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side - Auth & Profile Section */}
        <div className="hidden md:flex items-center gap-3 z-10">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-border-subtle transition-colors border border-border-subtle flex items-center justify-center cursor-pointer"
            style={{ color: "var(--text-primary)" }}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2.5">
              {/* Quick Dashboard Link */}
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-white/90 flex items-center gap-2 hover:border-[var(--accent-orange)] transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                <span>Dashboard</span>
              </Link>

              {/* Profile Avatar Trigger & Dropdown Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all active:scale-95 cursor-pointer group"
                  aria-expanded={userDropdownOpen}
                  aria-label="User profile menu"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-sm group-hover:border-[var(--accent-orange)] transition-colors">
                    <Image
                      src={activeAvatar.src}
                      alt={activeAvatar.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <span className="text-xs font-semibold text-white/90 max-w-[110px] truncate hidden sm:inline-block">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${
                      userDropdownOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                {/* Profile Section Popover Dropdown */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#140f1a] border border-white/15 shadow-2xl backdrop-blur-2xl p-4 z-50 text-white space-y-4"
                      style={{
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      {/* User Header: Avatar, Name & Gmail */}
                      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shrink-0 shadow-md">
                          <Image
                            src={activeAvatar.src}
                            alt={activeAvatar.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate">
                            {displayName}
                          </div>
                          {userEmail && (
                            <div className="text-xs text-white/50 truncate font-mono mt-0.5">
                              {userEmail}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 6 Curated Switcher Avatars */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">
                            Choose Avatar
                          </span>
                          <span className="text-[10px] text-amber-400 font-medium">
                            {activeAvatar.name}
                          </span>
                        </div>
                        <div className="grid grid-cols-6 gap-2 pt-0.5">
                          {AVATAR_OPTIONS.map((avatar) => {
                            const isSelected = avatar.id === selectedAvatarId;
                            return (
                              <button
                                key={avatar.id}
                                type="button"
                                onClick={() => handleSelectAvatar(avatar.id)}
                                className={`relative aspect-square rounded-full overflow-hidden transition-all duration-200 cursor-pointer p-0.5 ${
                                  isSelected
                                    ? "ring-2 ring-orange-500 scale-110 shadow-lg"
                                    : "opacity-60 hover:opacity-100 hover:scale-105"
                                }`}
                                title={avatar.name}
                              >
                                <div className="relative w-full h-full rounded-full overflow-hidden">
                                  <Image
                                    src={avatar.src}
                                    alt={avatar.name}
                                    fill
                                    className="object-cover"
                                    sizes="36px"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3 Action Buttons: View Profile, Settings, Logout */}
                      <div className="pt-2 border-t border-white/10 space-y-1">
                        {/* 1. View Profile */}
                        <Link
                          href="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <User className="w-4 h-4 text-[var(--accent-orange)]" />
                          <span>View Profile</span>
                        </Link>

                        {/* 2. Settings */}
                        <Link
                          href="/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-white/60" />
                          <span>Settings</span>
                        </Link>

                        {/* 3. Logout */}
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  e.target.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "var(--text-secondary)";
                }}
              >
                Login
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Controls: Instant Theme Toggle & Menu Hamburger */}
        <div className="flex md:hidden items-center gap-2 z-50">
          <button 
            onClick={toggleTheme}
            className="p-2 min-w-[38px] min-h-[38px] rounded-full hover:bg-white/10 transition-colors border border-border-subtle flex items-center justify-center cursor-pointer"
            style={{ color: "var(--text-primary)" }}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-2 min-w-[40px] min-h-[40px] rounded-xl hover:bg-white/10 flex items-center justify-center cursor-pointer"
            style={{ color: "var(--text-primary)" }}
            id="mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 md:hidden overflow-y-auto"
            style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex flex-col items-center justify-center min-h-full py-12 px-6 gap-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-2xl font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="flex flex-col gap-4 mt-4 w-full max-w-xs"
              >
                {isLoggedIn ? (
                  <div className="bg-[#140f1a] border border-white/15 rounded-2xl p-4 text-white space-y-4 shadow-xl">
                    {/* User Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/20 shrink-0">
                        <Image
                          src={activeAvatar.src}
                          alt={activeAvatar.name}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">
                          {displayName}
                        </div>
                        {userEmail && (
                          <div className="text-xs text-white/50 truncate font-mono mt-0.5">
                            {userEmail}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 6 Avatars */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-white/40 uppercase font-bold">
                        <span>Choose Avatar</span>
                        <span className="text-amber-400">{activeAvatar.name}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {AVATAR_OPTIONS.map((avatar) => (
                          <button
                            key={avatar.id}
                            type="button"
                            onClick={() => handleSelectAvatar(avatar.id)}
                            className={`relative aspect-square rounded-full overflow-hidden cursor-pointer ${
                              avatar.id === selectedAvatarId
                                ? "ring-2 ring-orange-500 scale-105"
                                : "opacity-60"
                            }`}
                          >
                            <Image
                              src={avatar.src}
                              alt={avatar.name}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3 Action Buttons */}
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setMobileOpen(false)}
                        className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-xs"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </Link>

                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          handleLogout();
                        }}
                        className="btn-secondary text-red-400 border-red-500/20 w-full flex items-center justify-center gap-2 py-2.5 text-xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-secondary text-center"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary text-center"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
