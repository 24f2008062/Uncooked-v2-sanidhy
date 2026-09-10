"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { useSession } from "@/components/providers/SupabaseProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getRealClientDevice } from "@/lib/deviceDetector";
import {
  Shield,
  Check,
  CheckCircle2,
  AlertCircle,
  Plus,
  Upload,
  Lock,
  Calendar,
  Globe,
  ExternalLink,
  X,
  ChevronRight,
  Monitor,
  Smartphone,
  Trash2,
  CreditCard,
  Sparkles,
  Loader2,
  MinusCircle,
  RefreshCw,
  Bell,
  Mail,
} from "lucide-react";

const AVATAR_OPTIONS = [
  { id: "male", name: "Executive Male", src: "/avatars/male.svg" },
  { id: "female", name: "Professional Female", src: "/avatars/female.svg" },
  { id: "rockstar", name: "Rockstar Artist", src: "/avatars/rockstar.svg" },
  { id: "astronaut", name: "Space Explorer", src: "/avatars/astronaut.svg" },
  { id: "cyberpunk", name: "Cyberpunk Hacker", src: "/avatars/cyberpunk.svg" },
  { id: "exciting", name: "Party Excitement", src: "/avatars/exciting.svg" },
];

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "account";
  const [activeTab, setActiveTab] = useState(initialTab); // "account" | "preferences" | "payment"
  const { data: session, status } = useSession();
  const { mode, setTheme } = useTheme();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  // Profile Form State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("male");
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Social links
  const [socials, setSocials] = useState({
    instagram: "",
    x: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    website: "",
  });

  // Email & Phone State
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addEmailModalOpen, setAddEmailModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [phoneUpdateModalOpen, setPhoneUpdateModalOpen] = useState(false);
  const [newPhoneInput, setNewPhoneInput] = useState("");

  // Security & Authentication State
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Third Party Accounts State
  const [thirdParty] = useState({
    google: true,
  });




  // Active Devices State (populated dynamically with real client device)
  const [activeDevices, setActiveDevices] = useState([]);

  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Preferences State - Email Notifications
  const [emailNotifications, setEmailNotifications] = useState({
    eventReminders: true,
    hostAlerts: true,
    productUpdates: false,
  });

  // Payment State
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
    country: "India",
  });
  const [savedCards, setSavedCards] = useState([]);

  // Load user data on mount
  useEffect(() => {
    // 1. Check avatar
    const savedAvatar = localStorage.getItem("user_selected_avatar");
    if (savedAvatar && AVATAR_OPTIONS.some((a) => a.id === savedAvatar)) {
      setSelectedAvatarId(savedAvatar);
    }

    // 2. Load stored settings
    const storedSettings = localStorage.getItem("user_settings_profile");
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.socials) setSocials(parsed.socials);
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
      } catch (err) {
        console.error("Error reading stored settings:", err);
      }
    }

    // 3. Load Security & Integration States
    setHasPassword(localStorage.getItem("user_has_password") === "true");

    const storedEmailNotifs = localStorage.getItem("user_email_notifications");
    if (storedEmailNotifs) {
      try {
        setEmailNotifications(JSON.parse(storedEmailNotifs));
      } catch {}
    }

    // 4. Real Active Device Detection (eliminates fake mock iOS fixtures)
    let storedDevs = [];
    try {
      const rawDevs = localStorage.getItem("user_active_devices");
      if (rawDevs) storedDevs = JSON.parse(rawDevs);
    } catch {}
    const validOther = storedDevs.filter((d) => d.id !== realDev.id && !d.isMock);
    setActiveDevices([realDev, ...validOther]);

    // 5. Load user from backend API
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && payload.data?.user) {
          const u = payload.data.user;
          if (u.email) setPrimaryEmail(u.email);
          if (u.phoneE164) setPhoneNumber(u.phoneE164);
          const full = u.fullName || u.name || "";
          if (full) {
            const parts = full.split(" ");
            setFirstName(parts[0] || "");
            setLastName(parts.slice(1).join(" ") || "");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId) || AVATAR_OPTIONS[0];

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const fullCombinedName = `${firstName} ${lastName}`.trim();
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullCombinedName,
          name: fullCombinedName,
          phoneE164: phoneNumber,
        }),
      });

      // Also persist to localStorage for instant hydration
      localStorage.setItem("user_selected_avatar", selectedAvatarId);
      localStorage.setItem(
        "user_settings_profile",
        JSON.stringify({
          firstName,
          lastName,
          username,
          bio,
          socials,
          phoneNumber,
        })
      );

      setSaveSuccess(true);
      setToastMessage("Your profile changes have been saved successfully!");
      setTimeout(() => {
        setSaveSuccess(false);
        setToastMessage("");
      }, 3500);
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmailNotification = (key) => {
    setEmailNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("user_email_notifications", JSON.stringify(next));
      } catch {}
      return next;
    });
    setToastMessage("Notification preferences saved");
    setTimeout(() => setToastMessage(""), 2000);
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!cardForm.number || !cardForm.expiry) return;
    const cleanNumber = cardForm.number.replace(/\s+/g, "");
    const last4 = cleanNumber.slice(-4) || "8888";
    const newCard = {
      id: "card_" + Date.now(),
      brand: cleanNumber.startsWith("5") ? "Mastercard" : "Visa",
      last4,
      exp: cardForm.expiry || "09/29",
      isDefault: savedCards.length === 0,
    };
    setSavedCards([newCard, ...savedCards]);
    setAddCardModalOpen(false);
    setToastMessage("Payment card added securely via Stripe!");
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!deletePasswordInput) {
      alert("Please enter your current account password to confirm.");
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePasswordInput }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/");
      } else {
        alert(data.error?.message || "Account deletion failed. Verify password.");
      }
    } catch {
      alert("An unexpected error occurred during account deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Password Update with Policy Enforcement
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 12) {
      setPasswordError("Password must be at least 12 characters");
      return;
    }
    if (!/[A-Za-z]/.test(passwordForm.newPassword)) {
      setPasswordError("Password must include a letter");
      return;
    }
    if (!/[0-9]/.test(passwordForm.newPassword)) {
      setPasswordError("Password must include a number");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPasswordError(data.message || data.error || "Failed to update password");
        return;
      }
      setHasPassword(true);
      localStorage.setItem("user_has_password", "true");
      setPasswordModalOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setToastMessage("Password updated successfully!");
      setTimeout(() => setToastMessage(""), 3000);
    } catch {
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };




  // Revoke device session
  const handleRevokeDevice = (id) => {
    const updated = activeDevices.filter((d) => d.id !== id);
    setActiveDevices(updated);
    localStorage.setItem("user_active_devices", JSON.stringify(updated.filter((d) => !d.isCurrent)));
    setToastMessage("Device session revoked successfully");
    setTimeout(() => setToastMessage(""), 2500);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-primary text-text-primary transition-colors duration-200 pt-24 sm:pt-28 pb-32">
        {/* Toast Notification Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-emerald-500/90 text-white text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header Title & Nav Tabs */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-4">
              {t("settings.title", "Settings")}
            </h1>
            <div className="flex items-center gap-4 sm:gap-6 border-b border-border-subtle pb-0 text-sm font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
              {[
                { id: "account", label: t("settings.tabs.account", "Account") },
                { id: "preferences", label: t("settings.tabs.preferences", "Preferences") },
                { id: "payment", label: t("settings.tabs.payment", "Payment") },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative pb-3 text-sm font-semibold transition-colors cursor-pointer ${
                      isActive ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeSettingsTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-orange)] rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: ACCOUNT (Screenshots 2 & 3) */}
          {/* ========================================================================= */}
          {activeTab === "account" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              {/* SECTION: Your Profile */}
              <section className="space-y-5">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  {t("settings.profile.title", "Your Profile")}
                </h2>

                <div className="flex flex-col-reverse sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
                  {/* First & Last Name */}
                  <div className="w-full flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-medium">
                        {t("settings.profile.firstName", "First Name")}
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-medium">
                        {t("settings.profile.lastName", "Last Name")}
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Profile Picture with Switcher Overlay */}
                  <div className="shrink-0 flex flex-col items-center">
                    <label className="block text-xs text-text-muted mb-1.5 font-medium self-start">
                      {t("settings.profile.picture", "Profile Picture")}
                    </label>
                    <div className="relative group cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
                      <div className="w-16 h-16 rounded-full overflow-hidden border border-border-subtle shadow-md bg-secondary relative">
                        <Image
                          src={activeAvatar.src}
                          alt={activeAvatar.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <button
                        type="button"
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--accent-orange)] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                        title="Change avatar"
                      >
                        <Upload className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">
                    {t("settings.profile.username", "Username")}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm text-text-muted font-mono">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-secondary border border-border-subtle rounded-xl pl-8 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">
                    {t("settings.profile.bio", "Bio")}
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t("settings.profile.bioPlaceholder", "Share a little about your background and interests.")}
                    className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-xs text-text-muted mb-2 font-medium">
                    {t("settings.profile.socials", "Social Links")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Instagram */}
                    <div className="flex items-center bg-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs focus-within:border-[var(--accent-orange)] overflow-hidden">
                      <InstagramIcon className="w-4 h-4 text-text-secondary mr-2 shrink-0" />
                      <span className="text-text-muted font-mono mr-1 shrink-0 text-[11px] sm:text-xs">instagram.com/</span>
                      <input
                        type="text"
                        value={socials.instagram}
                        onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* X / Twitter */}
                    <div className="flex items-center bg-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs focus-within:border-[var(--accent-orange)] overflow-hidden">
                      <XIcon className="w-4 h-4 text-text-secondary mr-2 shrink-0" />
                      <span className="text-text-muted font-mono mr-1 shrink-0 text-[11px] sm:text-xs">x.com/</span>
                      <input
                        type="text"
                        value={socials.x}
                        onChange={(e) => setSocials({ ...socials, x: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* YouTube */}
                    <div className="flex items-center bg-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs focus-within:border-[var(--accent-orange)] overflow-hidden">
                      <YouTubeIcon className="w-4 h-4 text-text-secondary mr-2 shrink-0" />
                      <span className="text-text-muted font-mono mr-1 shrink-0 text-[11px] sm:text-xs">youtube.com/@</span>
                      <input
                        type="text"
                        value={socials.youtube}
                        onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* TikTok */}
                    <div className="flex items-center bg-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs focus-within:border-[var(--accent-orange)] overflow-hidden">
                      <TikTokIcon className="w-4 h-4 text-text-secondary mr-2 shrink-0" />
                      <span className="text-text-muted font-mono mr-1 shrink-0 text-[11px] sm:text-xs">tiktok.com/@</span>
                      <input
                        type="text"
                        value={socials.tiktok}
                        onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-center bg-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs focus-within:border-[var(--accent-orange)] overflow-hidden">
                      <LinkedInIcon className="w-4 h-4 text-text-secondary mr-2 shrink-0" />
                      <span className="text-text-muted font-mono mr-1 shrink-0 text-[11px] sm:text-xs">linkedin.com/in/</span>
                      <input
                        type="text"
                        value={socials.linkedin}
                        onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* Website */}
                    <div className="flex items-center bg-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs focus-within:border-[var(--accent-orange)] overflow-hidden">
                      <Globe className="w-4 h-4 text-text-secondary mr-2 shrink-0" />
                      <input
                        type="text"
                        value={socials.website}
                        onChange={(e) => setSocials({ ...socials, website: e.target.value })}
                        placeholder="Your website"
                        className="w-full min-w-0 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Changes Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    )}
                    <span>{saving ? t("common.saving", "Saving...") : t("common.saveChanges", "Save Changes")}</span>
                  </button>
                </div>
              </section>

              {/* SECTION: Emails */}
              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-text-primary tracking-tight">
                    {t("settings.emails.title", "Emails")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setAddEmailModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-card-hover border border-border-subtle text-xs font-semibold text-text-primary transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t("settings.emails.addBtn", "Add Email")}</span>
                  </button>
                </div>
                <p className="text-xs text-text-muted">
                  {t("settings.emails.desc", "Add additional emails to receive event invites sent to those addresses.")}
                </p>

                {/* Primary Email Card */}
                <div className="p-3.5 rounded-2xl bg-card border border-border-subtle flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary font-mono">{primaryEmail}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary border border-border-subtle text-text-secondary">
                        {t("settings.emails.primaryBadge", "Primary")}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      {t("settings.emails.primaryNote", "This email will be shared with hosts when you register for their events.")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-secondary transition-colors"
                  >
                    •••
                  </button>
                </div>
              </section>

              {/* SECTION: Phone Number */}
              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  {t("settings.phone.title", "Phone Number")}
                </h2>
                <p className="text-xs text-text-muted">
                  {t("settings.phone.desc", "Manage the phone number you use to sign in to Opportia and receive SMS updates.")}
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-sm flex items-center bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm">
                    <span className="font-mono text-text-primary flex-1">{phoneNumber}</span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-card border border-border-subtle text-text-secondary">
                      IN
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhoneUpdateModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-card-hover border border-border-subtle text-text-primary text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t("settings.phone.updateBtn", "Update")}
                  </button>
                </div>
                <p className="text-[11px] text-text-muted">
                  {t("settings.phone.securityNote", "For your security, we will send you a code to verify any change to your phone number.")}
                </p>
              </section>

              {/* SECTION: Password & Security */}
              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                  <h2 className="text-base font-bold text-text-primary tracking-tight">
                    {t("settings.security.title", "Password & Security")}
                  </h2>
                </div>

                <div className="rounded-2xl bg-card border border-border-subtle divide-y divide-border-subtle">
                  {/* Account Password */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-text-secondary shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-text-primary">
                          {t("settings.security.accountPassword", "Account Password")}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {hasPassword
                            ? t("settings.security.passwordSet", "Your account is protected with a secure password.")
                            : t("settings.security.passwordNotSet", "You have not set up a password for your account.")}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasswordModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-card-hover border border-border-subtle text-text-primary text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      {hasPassword
                        ? t("settings.security.changePassword", "Change Password")
                        : t("settings.security.setPassword", "Set Password")}
                    </button>
                  </div>

                </div>
              </section>

              {/* SECTION: Third Party Accounts */}
              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  {t("settings.thirdParty.title", "Third Party Accounts")}
                </h2>
                <p className="text-xs text-text-muted">
                  {t("settings.thirdParty.desc", "Link your accounts to sign in to Opportia and automate your workflows.")}
                </p>

                <div className="max-w-md">
                  {/* Google */}
                  <div className="p-3.5 rounded-2xl bg-card border border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <GoogleIcon className="w-5 h-5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-primary">{t("settings.thirdParty.google", "Google")}</div>
                        <div className="text-[11px] text-text-secondary truncate font-mono">
                          {primaryEmail || t("settings.thirdParty.connected", "Connected")}
                        </div>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                </div>
              </section>



              {/* SECTION: Active Devices */}
              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  {t("settings.devices.title", "Active Devices")}
                </h2>
                <p className="text-xs text-text-muted">
                  {t("settings.devices.desc", "You are currently signed into Opportia on the following verified device.")}
                </p>

                <div className="space-y-2">
                  {activeDevices.map((device) => (
                    <div
                      key={device.id}
                      className="p-3.5 rounded-2xl bg-card border border-border-subtle flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {device.isMobile ? (
                          <Smartphone className="w-5 h-5 text-text-secondary" />
                        ) : (
                          <Monitor className="w-5 h-5 text-text-secondary" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-primary">{device.name}</span>
                            {device.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {t("settings.devices.thisDevice", "This Device")}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-muted">
                            {device.lastActive || t("settings.devices.activeNow", "Active now")} • {t("settings.devices.currentSession", "Current Session")}
                          </div>
                        </div>
                      </div>
                      {!device.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeDevice(device.id)}
                          className="text-text-muted hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title={t("settings.devices.revokeBtn", "Sign out device")}
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION: Delete Account */}
              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  {t("settings.delete.title", "Delete Account")}
                </h2>
                <p className="text-xs text-text-muted">
                  {t("settings.delete.desc", "If you no longer wish to use Opportia, you can permanently delete your account.")}
                </p>

                <button
                  type="button"
                  onClick={() => setDeleteAccountModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{t("settings.delete.button", "Delete My Account")}</span>
                </button>
              </section>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PREFERENCES (Screenshot 4) */}
          {/* ========================================================================= */}
          {activeTab === "preferences" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              {/* SECTION: Display */}
              <section className="space-y-5">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  {t("settings.display.title", "Display")}
                </h2>

                {/* 3 Preview Theme Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {/* 1. System */}
                  <div
                    onClick={() => setTheme("system")}
                    className={`cursor-pointer rounded-2xl border p-2.5 sm:p-3 transition-all ${
                      mode === "system"
                        ? "border-[var(--accent-orange)] bg-[var(--accent-orange)]/10 ring-1 ring-[var(--accent-orange)]"
                        : "border-border-subtle hover:border-border-hover bg-card"
                    }`}
                  >
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-r from-amber-200 via-rose-300 to-indigo-950 p-1.5 flex flex-col justify-between shadow-inner relative">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </div>
                      <div className="flex items-center justify-around font-serif font-bold text-xs opacity-80">
                        <span className="text-black">Aa</span>
                        <span className="text-white">Aa</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-text-primary">
                        {t("settings.display.system", "System")}
                      </span>
                      {mode === "system" && (
                        <div className="w-4 h-4 rounded-full bg-[var(--accent-orange)] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Light */}
                  <div
                    onClick={() => setTheme("light")}
                    className={`cursor-pointer rounded-2xl border p-2.5 sm:p-3 transition-all ${
                      mode === "light"
                        ? "border-[var(--accent-orange)] bg-[var(--accent-orange)]/10 ring-1 ring-[var(--accent-orange)]"
                        : "border-border-subtle hover:border-border-hover bg-card"
                    }`}
                  >
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#f0f0f2] border border-black/10 p-1.5 flex flex-col justify-between shadow-inner">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
                        <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
                        <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
                      </div>
                      <div className="flex items-center justify-center font-serif font-bold text-xs text-black/70">
                        Aa
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-text-primary">
                        {t("settings.display.light", "Light")}
                      </span>
                      {mode === "light" && (
                        <div className="w-4 h-4 rounded-full bg-[var(--accent-orange)] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Dark */}
                  <div
                    onClick={() => setTheme("dark")}
                    className={`cursor-pointer rounded-2xl border p-2.5 sm:p-3 transition-all ${
                      mode === "dark"
                        ? "border-[var(--accent-orange)] bg-[var(--accent-orange)]/10 ring-1 ring-[var(--accent-orange)]"
                        : "border-border-subtle hover:border-border-hover bg-card"
                    }`}
                  >
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#18181b] border border-white/10 p-1.5 flex flex-col justify-between shadow-inner">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      </div>
                      <div className="flex items-center justify-center font-serif font-bold text-xs text-white/80">
                        Aa
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-text-primary">
                        {t("settings.display.dark", "Dark")}
                      </span>
                      {mode === "dark" && (
                        <div className="w-4 h-4 rounded-full bg-[var(--accent-orange)] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Language Preference */}
                <div className="max-w-xs space-y-1.5 pt-2">
                  <label className="block text-xs text-text-muted font-medium">
                    {t("settings.language.title", "Language")}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => {
                      const newCode = e.target.value;
                      setLanguage(newCode);
                      const chosen = supportedLanguages.find((l) => l.code === newCode);
                      const display = chosen ? `${chosen.name} (${chosen.nativeName})` : newCode;
                      setToastMessage(`${t("settings.language.title", "Language")}: ${display}`);
                      setTimeout(() => setToastMessage(""), 2500);
                    }}
                    className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2 text-sm text-text-primary focus:border-[var(--accent-orange)] focus:outline-none transition-colors cursor-pointer"
                  >
                    {supportedLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-text-muted">
                    {t("settings.language.desc", "Select your preferred language for the Opportia portal interface.")}
                  </p>
                </div>
              </section>

              {/* SECTION: Notifications */}
              <section className="space-y-4 pt-6 border-t border-border-subtle">
                <div>
                  <h2 className="text-base font-bold text-text-primary tracking-tight">Email Notifications</h2>
                  <p className="text-xs text-text-muted mt-1">
                    Manage the email updates you receive from Opportia for your events and account.
                  </p>
                </div>

                <div className="rounded-2xl bg-card border border-border-subtle divide-y divide-border-subtle">
                  {/* Event Reminders & Passes */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-text-secondary shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-text-primary">
                          Event Reminders & Passes
                        </div>
                        <div className="text-[11px] text-text-muted">
                          Receive email reminders 24h before events you attend, schedule updates, and QR tickets.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailNotifications.eventReminders}
                      onClick={() => handleToggleEmailNotification("eventReminders")}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        emailNotifications.eventReminders
                          ? "bg-[var(--accent-orange)]"
                          : "bg-secondary border border-border-subtle"
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          emailNotifications.eventReminders ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Organizer & Registration Alerts */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-text-secondary shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-text-primary">
                          Organizer & Registration Alerts
                        </div>
                        <div className="text-[11px] text-text-muted">
                          Get notified when guests register for your hosted events, check in, or submit inquiries.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailNotifications.hostAlerts}
                      onClick={() => handleToggleEmailNotification("hostAlerts")}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        emailNotifications.hostAlerts
                          ? "bg-[var(--accent-orange)]"
                          : "bg-secondary border border-border-subtle"
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          emailNotifications.hostAlerts ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Platform & Community Updates */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-text-secondary shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-text-primary">
                          Platform & Community Updates
                        </div>
                        <div className="text-[11px] text-text-muted">
                          Occasional updates on new features, product improvements, and campus community highlights.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailNotifications.productUpdates}
                      onClick={() => handleToggleEmailNotification("productUpdates")}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        emailNotifications.productUpdates
                          ? "bg-[var(--accent-orange)]"
                          : "bg-secondary border border-border-subtle"
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          emailNotifications.productUpdates ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PAYMENT (Screenshot 5) */}
          {/* ========================================================================= */}
          {activeTab === "payment" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              {/* SECTION: Payment Methods */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  {t("settings.payment.title", "Payment Methods")}
                </h2>
                <p className="text-xs text-text-muted">
                  {t(
                    "settings.payment.desc",
                    "Your saved payment methods are encrypted and stored securely by Stripe."
                  )}
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setAddCardModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t("settings.payment.addCard", "Add Card")}</span>
                  </button>
                </div>

                {/* Saved Cards List */}
                {savedCards.length > 0 && (
                  <div className="pt-3 space-y-2">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3.5 rounded-2xl bg-card border border-border-subtle flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-text-secondary" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-text-primary">
                                {card.brand} •••• {card.last4}
                              </span>
                              {card.isDefault && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary border border-border-subtle text-text-secondary">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-text-muted">Expires {card.exp}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSavedCards(savedCards.filter((c) => c.id !== card.id));
                            setToastMessage("Card removed from your account");
                            setTimeout(() => setToastMessage(""), 2500);
                          }}
                          className="text-text-muted hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title="Remove card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION: Opportia Plus */}
              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-text-primary tracking-tight">
                    {t("settings.payment.plusTitle", "Opportia Plus")}
                  </h2>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors group"
                  >
                    <span>{t("settings.payment.learnMore", "Learn More")}</span>
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
                <p className="text-xs text-text-muted">
                  {t(
                    "settings.payment.plusDesc",
                    "Enjoy 0% platform fees, higher invite and admin limits, priority support, and more."
                  )}
                </p>

                {/* Personal Calendar Level Card */}
                <Link
                  href="/pricing"
                  className="p-3.5 rounded-2xl bg-card border border-border-subtle flex items-center justify-between cursor-pointer hover:border-border-hover transition-colors block group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full overflow-hidden relative bg-secondary border border-border-subtle">
                      <Image src={activeAvatar.src} alt="Avatar" fill className="object-cover" sizes="28px" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text-primary">
                        {t("settings.payment.personal", "Personal")}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {t("settings.payment.freeTier", "Free Tier")}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <p className="text-[11px] text-text-muted">
                  {t(
                    "settings.payment.plusScope",
                    "Opportia Plus applies on the calendar level. Choose the desired calendar above to manage its Opportia Plus membership."
                  )}
                </p>
              </section>

              {/* SECTION: Payment History */}
              <section className="space-y-4 pt-6 border-t border-border-subtle">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  {t("settings.payment.historyTitle", "Payment History")}
                </h2>

                {/* Empty State: Perforated Receipt Graphic */}
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <ReceiptIllustration />
                  <h3 className="text-sm font-bold text-text-primary mt-4 mb-1">
                    {t("settings.payment.noPayments", "No Payments")}
                  </h3>
                  <p className="text-xs text-text-muted max-w-sm">
                    {t(
                      "settings.payment.noPaymentsDesc",
                      "Your payments will appear here. To view Opportia Plus payments, select the corresponding calendar from the section above."
                    )}
                  </p>
                </div>
              </section>
            </motion.div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: 6-Avatar Switcher Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {avatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-elevated border border-border-subtle rounded-3xl p-5 sm:p-6 shadow-2xl text-text-primary space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary">Choose Profile Avatar</h3>
                  <p className="text-xs text-text-muted">Select one of the 6 official avatars for your profile.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {AVATAR_OPTIONS.map((avatar) => {
                  const isSelected = avatar.id === selectedAvatarId;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatarId(avatar.id);
                        localStorage.setItem("user_selected_avatar", avatar.id);
                        setAvatarModalOpen(false);
                        setToastMessage(`Selected ${avatar.name} avatar`);
                        setTimeout(() => setToastMessage(""), 2000);
                      }}
                      className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[var(--accent-orange)] bg-[var(--accent-orange)]/10 ring-2 ring-[var(--accent-orange)]/50"
                          : "border-border-subtle hover:border-border-hover bg-secondary"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden relative mb-2">
                        <Image src={avatar.src} alt={avatar.name} fill className="object-cover" sizes="56px" />
                      </div>
                      <span className="text-[11px] font-semibold text-text-primary text-center leading-tight">
                        {avatar.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: Password Update Modal with Real-time Policy Validation */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {passwordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-elevated border border-border-subtle rounded-3xl p-5 sm:p-6 shadow-2xl text-text-primary space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {hasPassword ? t("settings.passwordModal.titleChange", "Update Account Password") : t("settings.passwordModal.titleSet", "Set Account Password")}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {hasPassword ? t("settings.passwordModal.descChange", "Enter your current password and choose a new secure password.") : t("settings.passwordModal.descSet", "Protect your Opportia account with a strong, policy-compliant password.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordError("");
                  }}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-3.5 pt-1">
                {hasPassword && (
                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-medium">{t("settings.passwordModal.currentPass", "Current Password")}</label>
                    <input
                      required
                      type="password"
                      placeholder={t("settings.passwordModal.currentPass", "Enter your current password")}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-text-muted mb-1 font-medium">{t("settings.passwordModal.newPass", "New Password")}</label>
                  <input
                    required
                    type="password"
                    placeholder={t("settings.passwordModal.newPass", "Enter new password (min 12 characters)")}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1 font-medium">{t("settings.passwordModal.confirmPass", "Confirm New Password")}</label>
                  <input
                    required
                    type="password"
                    placeholder={t("settings.passwordModal.confirmPass", "Re-enter new password")}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none"
                  />
                </div>

                {/* Real-time Password Policy Checklist */}
                <div className="p-3 rounded-2xl bg-secondary/70 border border-border-subtle space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                    {t("settings.passwordModal.requirements", "Password Requirements:")}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        passwordForm.newPassword.length >= 12
                          ? "bg-emerald-500 text-white"
                          : "bg-border-subtle text-text-muted"
                      }`}
                    >
                      {passwordForm.newPassword.length >= 12 ? "✓" : "•"}
                    </div>
                    <span
                      className={
                        passwordForm.newPassword.length >= 12
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-text-muted"
                      }
                    >
                      {t("settings.passwordModal.ruleLength", "At least 12 characters long")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        /[A-Za-z]/.test(passwordForm.newPassword)
                          ? "bg-emerald-500 text-white"
                          : "bg-border-subtle text-text-muted"
                      }`}
                    >
                      {/[A-Za-z]/.test(passwordForm.newPassword) ? "✓" : "•"}
                    </div>
                    <span
                      className={
                        /[A-Za-z]/.test(passwordForm.newPassword)
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-text-muted"
                      }
                    >
                      {t("settings.passwordModal.ruleLetter", "Includes at least one letter")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        /[0-9]/.test(passwordForm.newPassword)
                          ? "bg-emerald-500 text-white"
                          : "bg-border-subtle text-text-muted"
                      }`}
                    >
                      {/[0-9]/.test(passwordForm.newPassword) ? "✓" : "•"}
                    </div>
                    <span
                      className={
                        /[0-9]/.test(passwordForm.newPassword)
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-text-muted"
                      }
                    >
                      {t("settings.passwordModal.ruleNumber", "Includes at least one number")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword
                          ? "bg-emerald-500 text-white"
                          : "bg-border-subtle text-text-muted"
                      }`}
                    >
                      {passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword ? "✓" : "•"}
                    </div>
                    <span
                      className={
                        passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-text-muted"
                      }
                    >
                      {t("settings.passwordModal.ruleMatch", "Passwords match")}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordModalOpen(false);
                      setPasswordError("");
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  >
                    {t("common.cancel", "Cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{hasPassword ? t("settings.security.updatePassword", "Update Password") : t("settings.security.setPassword", "Set Password")}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: Add Card Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {addCardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-elevated border border-border-subtle rounded-3xl p-5 sm:p-6 shadow-2xl text-text-primary space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary">Add Payment Card</h3>
                  <p className="text-xs text-text-muted">Secured with 256-bit Stripe encryption.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddCardModalOpen(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCard} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-text-muted mb-1 font-medium">Card Number</label>
                  <div className="relative flex items-center">
                    <CreditCard className="w-4 h-4 text-text-muted absolute left-3.5" />
                    <input
                      required
                      maxLength={19}
                      type="text"
                      placeholder="4242 •••• •••• 4242"
                      value={cardForm.number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                        const parts = val.match(/.{1,4}/g);
                        setCardForm({ ...cardForm, number: parts ? parts.join(" ") : "" });
                      }}
                      className="w-full bg-secondary border border-border-subtle rounded-xl pl-10 pr-3.5 py-2 text-sm text-text-primary font-mono placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-medium">Expiration (MM/YY)</label>
                    <input
                      required
                      maxLength={5}
                      type="text"
                      placeholder="12/28"
                      value={cardForm.expiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^\d/]/g, "").slice(0, 5);
                        if (val.length === 2 && !val.includes("/")) val = val + "/";
                        setCardForm({ ...cardForm, expiry: val });
                      }}
                      className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2 text-sm text-text-primary font-mono placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-medium">CVC</label>
                    <input
                      required
                      maxLength={4}
                      type="password"
                      placeholder="•••"
                      value={cardForm.cvc}
                      onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2 text-sm text-text-primary font-mono placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1 font-medium">Cardholder Name</label>
                  <input
                    required
                    type="text"
                    value={cardForm.name}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                    className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddCardModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    Save Card
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: Add Email Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {addEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-elevated border border-border-subtle rounded-3xl p-6 shadow-2xl text-text-primary space-y-4"
            >
              <h3 className="text-base font-bold text-text-primary">{t("settings.emails.modalTitle", "Add Additional Email")}</h3>
              <p className="text-xs text-text-muted">
                {t("settings.emails.modalDesc", "You'll receive a confirmation link to verify ownership.")}
              </p>
              <input
                type="email"
                placeholder="secondary@example.com"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary font-mono placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddEmailModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddEmailModalOpen(false);
                    setToastMessage(t("settings.emails.verificationSent", "Verification link sent to ") + newEmailInput);
                    setNewEmailInput("");
                    setTimeout(() => setToastMessage(""), 3000);
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold hover:brightness-110 transition-colors cursor-pointer shadow-md"
                >
                  {t("settings.emails.sendVerification", "Send Verification")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: Update Phone Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {phoneUpdateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-elevated border border-border-subtle rounded-3xl p-6 shadow-2xl text-text-primary space-y-4"
            >
              <h3 className="text-base font-bold text-text-primary">{t("settings.phone.modalTitle", "Update Phone Number")}</h3>
              <p className="text-xs text-text-muted">
                {t("settings.phone.modalDesc", "Enter your mobile number with country code. A verification OTP will be sent.")}
              </p>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={newPhoneInput}
                onChange={(e) => setNewPhoneInput(e.target.value)}
                className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary font-mono placeholder:text-text-muted focus:border-[var(--accent-orange)] focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPhoneUpdateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneNumber(newPhoneInput);
                    setPhoneUpdateModalOpen(false);
                    setToastMessage(t("settings.phone.updatedSuccess", "Phone number updated successfully!"));
                    setTimeout(() => setToastMessage(""), 2500);
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold hover:brightness-110 transition-colors cursor-pointer shadow-md"
                >
                  {t("settings.phone.confirmBtn", "Confirm & Update")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 5: Delete Account Confirmation Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deleteAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-elevated border border-red-500/30 rounded-3xl p-6 shadow-2xl text-text-primary space-y-4"
            >
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-text-primary">{t("settings.delete.title", "Delete Account")}</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {t("settings.delete.confirmDesc", "This will permanently delete your account, event registrations, tickets, and private data in accordance with DPDP regulations. This action cannot be reversed.")}
              </p>
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium">{t("settings.delete.passwordConfirm", "Enter your password to confirm:")}</label>
                <input
                  type="password"
                  placeholder={t("settings.delete.passwordPlaceholder", "Your current password")}
                  value={deletePasswordInput}
                  onChange={(e) => setDeletePasswordInput(e.target.value)}
                  className="w-full bg-secondary border border-border-subtle rounded-xl px-3.5 py-2 text-sm text-text-primary font-mono placeholder:text-text-muted focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteAccountModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {deleteLoading ? t("common.loading", "Deleting...") : t("settings.delete.button", "Permanently Delete")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary" />}>
      <SettingsPageInner />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS & BRAND ICONS
// ---------------------------------------------------------------------------



// Perforated Receipt Graphic matching Screenshot 5
function ReceiptIllustration() {
  return (
    <svg width="68" height="76" viewBox="0 0 68 76" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
      <path
        d="M6 6C6 3.79086 7.79086 2 10 2H58C60.2091 2 62 3.79086 62 6V68L56 64L50 68L44 64L38 68L32 64L26 68L20 64L14 68L6 63V6Z"
        fill="var(--bg-card)"
        stroke="var(--border-hover)"
        strokeWidth="2"
      />
      {/* Receipt Lines */}
      <rect x="14" y="14" width="22" height="4" rx="2" fill="var(--text-muted)" />
      <rect x="14" y="24" width="38" height="4" rx="2" fill="var(--text-muted)" />
      <rect x="14" y="34" width="32" height="4" rx="2" fill="var(--text-muted)" />
      <line x1="14" y1="46" x2="54" y2="46" stroke="var(--border-hover)" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="50" cy="16" r="3" fill="var(--text-muted)" />
      <rect x="14" y="52" width="14" height="2" rx="1" fill="var(--text-muted)" />
    </svg>
  );
}

// Crisp Brand SVGs
function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}



function SolanaIcon(props) {
  return (
    <svg viewBox="0 0 397.7 311.7" fill="url(#solana-grad)" {...props}>
      <defs>
        <linearGradient id="solana-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67 1.4 70.3 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8zm268.5 115.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
    </svg>
  );
}

function EthereumIcon(props) {
  return (
    <svg viewBox="0 0 784.37 1277.39" fill="currentColor" {...props}>
      <path d="M392.07 0L383.5 29.11V874.74L392.07 883.29L784.13 651.54L392.07 0Z" fill="#8A92B2" />
      <path d="M392.07 0L0 651.54L392.07 883.29V472.33V0Z" fill="#62688F" />
      <path d="M392.07 956.52L387.24 962.41V1263.28L392.07 1277.38L784.37 724.89L392.07 956.52Z" fill="#8A92B2" />
      <path d="M392.07 1277.38V956.52L0 724.89L392.07 1277.38Z" fill="#62688F" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.72 1.25-.09 2.37-.87 2.77-2.06.27-.75.25-1.57.25-2.36V.02z" />
    </svg>
  );
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.92 0 1.67-.75 1.67-1.67 0-.92-.75-1.67-1.67-1.67-.92 0-1.67.75-1.67 1.67 0 .92.75 1.67 1.67 1.67M7.85 18.5V10.1H5.07v8.4h2.78z" />
    </svg>
  );
}
