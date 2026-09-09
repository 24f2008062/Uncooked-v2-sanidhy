"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
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
  CalendarPlus,
  ShieldCheck,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import NotificationBell from "@/components/layout/NotificationBell";

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
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const supabase = createClient();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

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
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
        setSettingsSubmenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll detection
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName =
    userProfile?.fullName ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.email?.split("@")[0] ||
    "Demo User";

  const userEmail =
    userProfile?.email ||
    currentUser?.email ||
    "";

  const navLinks = [
    { label: t("nav.events", "Events"), href: "/events" },
    ...(isLoggedIn ? [{ label: t("nav.dashboard", "Dashboard"), href: "/dashboard" }] : []),
    { label: t("nav.opportunities", "Opportunities"), href: "/opportunities" },
    { label: t("nav.createEvent", "Host an Event"), href: "/host" },
    { label: t("footer.about", "About"), href: "/about" },
    { label: "Help", href: "/help" },
    { label: t("footer.contact", "Contact"), href: "/contact" },
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
              className="text-lg font-bold tracking-tight text-[var(--text-primary)]"
              style={{ color: "var(--text-primary)" }}
            >
              OPPORTIA
            </span>
          </motion.div>
        </Link>

        {/* Desktop Nav Links (Centered in page) */}
        <div className="hidden md:flex items-center gap-0.5 lg:gap-1 absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const isDashboard = link.href === "/dashboard";
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--accent-orange)]/10 text-[var(--text-primary)] border border-[var(--accent-orange)]/30 shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]"
                }`}
              >
                {isDashboard && (
                  <LayoutDashboard className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
                )}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Side - Auth & Profile Section */}
        <div className="hidden md:flex items-center gap-3 z-10">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--border-subtle)] transition-colors border border-[var(--border-subtle)] flex items-center justify-center cursor-pointer text-[var(--text-primary)]"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--text-primary)]" />
            )}
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2.5">
              <NotificationBell />
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
                  className="relative p-0.5 rounded-full bg-[var(--border-subtle)] hover:bg-[var(--border-hover)] border border-[var(--border-subtle)] hover:border-[var(--accent-orange)] transition-all active:scale-95 cursor-pointer group flex items-center justify-center"
                  aria-expanded={userDropdownOpen}
                  aria-label="User profile menu"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[var(--border-subtle)] shadow-sm group-hover:border-[var(--accent-orange)] transition-colors">
                    <Image
                      src={activeAvatar.src}
                      alt={activeAvatar.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                </button>

                {/* Profile Section Popover Dropdown */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl p-3 z-50 text-[var(--text-primary)] space-y-2.5 max-h-[calc(100vh-5rem)] overflow-y-auto glass-scrollbar"
                      style={{
                        background: "var(--glass-dropdown-bg)",
                        borderColor: "var(--glass-dropdown-border)",
                        boxShadow: "var(--glass-dropdown-shadow)",
                        WebkitBackdropFilter: "blur(28px) saturate(180%)",
                        backdropFilter: "blur(28px) saturate(180%)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                    >
                      {/* User Header: Avatar, Name & Gmail */}
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-[var(--glass-inner-border)]">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/15 dark:border-white/15 light:border-black/10 shrink-0 shadow-md ring-1 ring-white/10">
                          <Image
                            src={activeAvatar.src}
                            alt={activeAvatar.name}
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {displayName}
                          </div>
                          {userEmail && (
                            <div className="text-[11px] text-[var(--text-secondary)] truncate font-mono mt-0.5">
                              {userEmail}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 6 Curated Switcher Avatars */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                            Choose Avatar
                          </span>
                          <span className="text-[10px] text-amber-500 font-semibold">
                            {activeAvatar.name}
                          </span>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5 pt-0.5">
                          {AVATAR_OPTIONS.map((avatar) => {
                            const isSelected = avatar.id === selectedAvatarId;
                            return (
                              <button
                                key={avatar.id}
                                type="button"
                                onClick={() => handleSelectAvatar(avatar.id)}
                                className={`relative aspect-square rounded-full overflow-hidden transition-all duration-200 cursor-pointer p-0.5 ${
                                  isSelected
                                    ? "ring-2 ring-orange-500 scale-110 shadow-sm"
                                    : "opacity-70 hover:opacity-100 hover:scale-105"
                                }`}
                                title={avatar.name}
                              >
                                <div className="relative w-full h-full rounded-full overflow-hidden">
                                  <Image
                                    src={avatar.src}
                                    alt={avatar.name}
                                    fill
                                    className="object-cover"
                                    sizes="28px"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Consolidated Actions: Dashboard, Profile, Settings, Host, Logout */}
                      <div className="pt-2 border-t border-[var(--glass-inner-border)] space-y-0.5">
                        {/* 1. Dashboard */}
                        <Link
                          href="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--glass-item-hover)] transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
                          <span>{t("nav.dashboard", "Dashboard")}</span>
                        </Link>

                        {/* 2. View Profile */}
                        <Link
                          href="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--glass-item-hover)] transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{t("nav.viewProfile", "View Profile")}</span>
                        </Link>

                        {/* 3. Settings with Dropdown Options */}
                        <div 
                          className="rounded-lg overflow-hidden border border-[var(--glass-inner-border)]"
                          style={{ background: "var(--glass-inner-bg)" }}
                        >
                          <button
                            type="button"
                            onClick={() => setSettingsSubmenuOpen(!settingsSubmenuOpen)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--glass-item-hover)] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <Settings className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{t("nav.settings", "Settings")}</span>
                            </div>
                            <ChevronDown
                              className={`w-3 h-3 text-[var(--text-secondary)] transition-transform duration-200 ${
                                settingsSubmenuOpen ? "rotate-180 text-[var(--text-primary)]" : ""
                              }`}
                            />
                          </button>
                          {settingsSubmenuOpen && (
                            <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-[var(--glass-inner-border)]">
                              <Link
                                href="/settings"
                                onClick={() => setUserDropdownOpen(false)}
                                className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-item-hover)] transition-colors"
                              >
                                <Settings className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                                <span>{t("nav.generalSettings", "General Settings")}</span>
                              </Link>
                              <Link
                                href="/settings#devices"
                                onClick={() => setUserDropdownOpen(false)}
                                className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-item-hover)] transition-colors"
                              >
                                <Monitor className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{t("nav.manageDesktops", "Manage Desktops & Sessions")}</span>
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* 4. Host Tools */}
                        <Link
                          href="/create"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--glass-item-hover)] transition-colors"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{t("nav.createEvent", "Create Event")}</span>
                        </Link>
                        <Link
                          href="/host/apply"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--glass-item-hover)] transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{t("nav.hostApply", "Host Application")}</span>
                        </Link>

                        {/* 5. Logout */}
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-3.5 h-3.5 shrink-0" />
                          <span>{t("nav.signOut", "Sign Out")}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : status === "loading" ? (
            <div className="w-24 h-9 rounded-full bg-[var(--border-subtle)] animate-pulse" />
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {t("nav.login", "Login")}
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                {t("nav.getStarted", "Get Started")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Controls: Instant Theme Toggle & Menu Hamburger */}
        <div className="flex md:hidden items-center gap-2 z-50">
          {isLoggedIn && <NotificationBell />}
          <button 
            onClick={toggleTheme}
            className="p-2 min-w-[38px] min-h-[38px] rounded-full hover:bg-[var(--border-subtle)] transition-colors border border-[var(--border-subtle)] flex items-center justify-center cursor-pointer text-[var(--text-primary)]"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--text-primary)]" />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-2 min-w-[40px] min-h-[40px] rounded-xl hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] flex items-center justify-center cursor-pointer text-[var(--text-primary)]"
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
            className="fixed inset-0 z-50 md:hidden overflow-y-auto bg-[var(--bg-primary)]/95 backdrop-blur-2xl"
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
                    className="text-2xl font-medium flex items-center gap-2.5 text-[var(--text-primary)] hover:text-[var(--accent-orange)] transition-colors"
                  >
                    {link.label === "Dashboard" && (
                      <LayoutDashboard className="w-6 h-6 text-[var(--accent-orange)]" />
                    )}
                    <span>{link.label}</span>
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
                  <div 
                    className="border rounded-2xl p-3.5 text-[var(--text-primary)] space-y-3.5 shadow-xl backdrop-blur-2xl"
                    style={{
                      background: "var(--glass-dropdown-bg)",
                      borderColor: "var(--glass-dropdown-border)",
                      boxShadow: "var(--glass-dropdown-shadow)",
                    }}
                  >
                    {/* User Header */}
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-[var(--glass-inner-border)]">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[var(--border-subtle)] shrink-0">
                        <Image
                          src={activeAvatar.src}
                          alt={activeAvatar.name}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {displayName}
                        </div>
                        {userEmail && (
                          <div className="text-xs text-[var(--text-secondary)] truncate font-mono mt-0.5">
                            {userEmail}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 6 Avatars */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase font-bold">
                        <span>Choose Avatar</span>
                        <span className="text-amber-500 font-semibold">{activeAvatar.name}</span>
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
                                : "opacity-70"
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
                    <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
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
                        className="btn-secondary text-red-500 border-red-500/30 w-full flex items-center justify-center gap-2 py-2.5 text-xs"
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
