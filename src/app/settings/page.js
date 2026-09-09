"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSession } from "@/components/providers/SupabaseProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Plus,
  Upload,
  Lock,
  Shield,
  Key,
  Calendar,
  Globe,
  ExternalLink,
  X,
  ChevronRight,
  ChevronsUpDown,
  Monitor,
  Smartphone,
  Trash2,
  CreditCard,
  Sparkles,
  Loader2,
  MinusCircle,
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
  const [newPhoneInput, setNewPhoneInput] = useState("+91 95691 29910");

  // Security modals
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Preferences State
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState({
    eventInvites: ["Email", "WhatsApp", "Push"],
    eventReminders: ["Email", "WhatsApp", "Push"],
    eventBlasts: ["Email", "WhatsApp", "Push"],
    eventUpdates: ["Email", "Push"],
    feedbackRequests: ["Email"],
    guestRegistrations: ["Email", "Push"],
    feedbackResponses: ["Email"],
    newMembers: ["Email", "Push"],
    eventSubmissions: ["Email"],
    productUpdates: ["Email"],
  });
  const [activeNotificationKey, setActiveNotificationKey] = useState(null);

  // Payment State
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "Siddhartha Singh",
    country: "India",
  });
  const [savedCards, setSavedCards] = useState([
    {
      id: "card_default_01",
      brand: "Visa",
      last4: "4242",
      exp: "12/28",
      isDefault: true,
    },
  ]);

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

    // 3. Load user from backend API
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

  const handleToggleNotificationChannel = (key, channel) => {
    setNotifications((prev) => {
      const current = prev[key] || [];
      const has = current.includes(channel);
      const updated = has ? current.filter((c) => c !== channel) : [...current, channel];
      return { ...prev, [key]: updated.length > 0 ? updated : ["Email"] };
    });
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

  return (
    <>
      <Navbar forceDarkTop />
      <main className="min-h-screen bg-[#0d0d0e] text-white pt-24 sm:pt-28 pb-32">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">Settings</h1>
            <div className="flex items-center gap-4 sm:gap-6 border-b border-white/10 pb-0 text-sm font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
              {[
                { id: "account", label: "Account" },
                { id: "preferences", label: "Preferences" },
                { id: "payment", label: "Payment" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative pb-3 text-sm font-semibold transition-colors cursor-pointer ${
                      isActive ? "text-white" : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeSettingsTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
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
                <h2 className="text-base font-bold text-white tracking-tight">Your Profile</h2>

                <div className="flex flex-col-reverse sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
                  {/* First & Last Name */}
                  <div className="w-full flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5 font-medium">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-[#161618] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-white/30 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5 font-medium">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-[#161618] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-white/30 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Profile Picture with Switcher Overlay */}
                  <div className="shrink-0 flex flex-col items-center">
                    <label className="block text-xs text-white/50 mb-1.5 font-medium self-start">Profile Picture</label>
                    <div className="relative group cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
                      <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20 shadow-md bg-white/5 relative">
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
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                        title="Change avatar"
                      >
                        <Upload className="w-3 h-3 text-black" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Username</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm text-white/40 font-mono">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-[#161618] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:border-white/30 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share a little about your background and interests."
                    className="w-full bg-[#161618] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-xs text-white/50 mb-2 font-medium">Social Links</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Instagram */}
                    <div className="flex items-center bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-xs focus-within:border-white/30 overflow-hidden">
                      <InstagramIcon className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                      <span className="text-white/40 font-mono mr-1 shrink-0 text-[11px] sm:text-xs">instagram.com/</span>
                      <input
                        type="text"
                        value={socials.instagram}
                        onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-white focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* X / Twitter */}
                    <div className="flex items-center bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-xs focus-within:border-white/30 overflow-hidden">
                      <XIcon className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                      <span className="text-white/40 font-mono mr-1 shrink-0 text-[11px] sm:text-xs">x.com/</span>
                      <input
                        type="text"
                        value={socials.x}
                        onChange={(e) => setSocials({ ...socials, x: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-white focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* YouTube */}
                    <div className="flex items-center bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-xs focus-within:border-white/30 overflow-hidden">
                      <YouTubeIcon className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                      <span className="text-white/40 font-mono mr-1 shrink-0 text-[11px] sm:text-xs">youtube.com/@</span>
                      <input
                        type="text"
                        value={socials.youtube}
                        onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-white focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* TikTok */}
                    <div className="flex items-center bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-xs focus-within:border-white/30 overflow-hidden">
                      <TikTokIcon className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                      <span className="text-white/40 font-mono mr-1 shrink-0 text-[11px] sm:text-xs">tiktok.com/@</span>
                      <input
                        type="text"
                        value={socials.tiktok}
                        onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-white focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-center bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-xs focus-within:border-white/30 overflow-hidden">
                      <LinkedInIcon className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                      <span className="text-white/40 font-mono mr-1 shrink-0 text-[11px] sm:text-xs">linkedin.com/in/</span>
                      <input
                        type="text"
                        value={socials.linkedin}
                        onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                        placeholder="username"
                        className="w-full min-w-0 bg-transparent text-white focus:outline-none font-mono text-[11px] sm:text-xs"
                      />
                    </div>

                    {/* Website */}
                    <div className="flex items-center bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-xs focus-within:border-white/30 overflow-hidden">
                      <Globe className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                      <input
                        type="text"
                        value={socials.website}
                        onChange={(e) => setSocials({ ...socials, website: e.target.value })}
                        placeholder="Your website"
                        className="w-full min-w-0 bg-transparent text-white focus:outline-none font-mono text-[11px] sm:text-xs"
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </section>

              {/* SECTION: Emails */}
              <section className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white tracking-tight">Emails</h2>
                  <button
                    type="button"
                    onClick={() => setAddEmailModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Email</span>
                  </button>
                </div>
                <p className="text-xs text-white/50">
                  Add additional emails to receive event invites sent to those addresses.
                </p>

                {/* Primary Email Card */}
                <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white font-mono">{primaryEmail}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80">
                        Primary
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40">
                      This email will be shared with hosts when you register for their events.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    •••
                  </button>
                </div>
              </section>

              {/* SECTION: Phone Number */}
              <section className="space-y-3 pt-6 border-t border-white/10">
                <h2 className="text-base font-bold text-white tracking-tight">Phone Number</h2>
                <p className="text-xs text-white/50">
                  Manage the phone number you use to sign in to Opportia and receive SMS updates.
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-sm flex items-center bg-[#161618] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm">
                    <span className="font-mono text-white flex-1">{phoneNumber}</span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                      IN
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhoneUpdateModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Update
                  </button>
                </div>
                <p className="text-[11px] text-white/40">
                  For your security, we will send you a code to verify any change to your phone number.
                </p>
              </section>

              {/* SECTION: Password & Security */}
              <section className="space-y-3 pt-6 border-t border-white/10">
                <h2 className="text-base font-bold text-white tracking-tight">Password & Security</h2>

                <div className="rounded-2xl bg-[#141416] border border-white/10 divide-y divide-white/5">
                  {/* Account Password */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-white/60 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Account Password</div>
                        <div className="text-[11px] text-white/50">You have not set up a password for your account.</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasswordModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      Set Password
                    </button>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-white/60 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Two-Factor Authentication</div>
                        <div className="text-[11px] text-white/50">Add an extra layer of security to your account.</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      Enable 2FA
                    </button>
                  </div>

                  {/* Passkeys */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4 text-white/60 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Passkeys</div>
                        <div className="text-[11px] text-white/50">You have 1 active passkey.</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setToastMessage("Passkey security credentials managed locally");
                        setTimeout(() => setToastMessage(""), 2500);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      Manage Passkeys
                    </button>
                  </div>
                </div>
              </section>

              {/* SECTION: Third Party Accounts */}
              <section className="space-y-3 pt-6 border-t border-white/10">
                <h2 className="text-base font-bold text-white tracking-tight">Third Party Accounts</h2>
                <p className="text-xs text-white/50">
                  Link your accounts to sign in to Opportia and automate your workflows.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Google (Linked) */}
                  <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <GoogleIcon className="w-5 h-5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">Google</div>
                        <div className="text-[11px] text-white/50 truncate font-mono">{primaryEmail}</div>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  {/* Apple */}
                  <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AppleIcon className="w-5 h-5 text-white shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Apple</div>
                        <div className="text-[11px] text-white/40">Not Linked</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Zoom */}
                  <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ZoomIcon className="w-5 h-5 text-blue-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Zoom</div>
                        <div className="text-[11px] text-white/40">Not Linked</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Solana */}
                  <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SolanaIcon className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Solana</div>
                        <div className="text-[11px] text-white/40">Not Linked</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Ethereum */}
                  <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <EthereumIcon className="w-5 h-5 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Ethereum</div>
                        <div className="text-[11px] text-white/40">Not Linked</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* SECTION: Account Syncing */}
              <section className="space-y-3 pt-6 border-t border-white/10">
                <h2 className="text-base font-bold text-white tracking-tight">Account Syncing</h2>

                <div className="rounded-2xl bg-[#141416] border border-white/10 divide-y divide-white/5">
                  {/* Calendar Syncing */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-white/60 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Calendar Syncing</div>
                        <div className="text-[11px] text-white/50">
                          Sync your Opportia events with your Google, Outlook, or Apple calendar.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.origin + "/api/calendar/ical/feed.ics");
                        setToastMessage("iCal subscription URL copied to clipboard!");
                        setTimeout(() => setToastMessage(""), 2500);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      Add iCal Subscription
                    </button>
                  </div>

                  {/* Sync Contacts with Google */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <GoogleIcon className="w-4 h-4 text-white/60 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Sync Contacts with Google</div>
                        <div className="text-[11px] text-white/50">
                          Sync your Gmail contacts to easily invite them to your events.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setToastMessage("Contacts syncing scheduled");
                        setTimeout(() => setToastMessage(""), 2500);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      Enable Syncing
                    </button>
                  </div>
                </div>
              </section>

              {/* SECTION: Active Devices */}
              <section className="space-y-3 pt-6 border-t border-white/10">
                <h2 className="text-base font-bold text-white tracking-tight">Active Devices</h2>
                <p className="text-xs text-white/50">
                  You are currently signed into Opportia on the following devices.
                </p>

                <div className="space-y-2">
                  {/* Device 1: Chrome on Windows */}
                  <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-white/60" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Chrome on Windows</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            This Device
                          </span>
                        </div>
                        <div className="text-[11px] text-white/40">Bengaluru, IN</div>
                      </div>
                    </div>
                  </div>

                  {/* Device 2: iOS App */}
                  <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-white/60" />
                      <div>
                        <div className="text-xs font-bold text-white">iOS App on Siddhartha&apos;s iPhone ✨</div>
                        <div className="text-[11px] text-white/40">Active Sep 5</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setToastMessage("Session revoked from device");
                        setTimeout(() => setToastMessage(""), 2500);
                      }}
                      className="text-white/40 hover:text-red-400 p-1 transition-colors"
                      title="Sign out device"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* SECTION: Delete Account */}
              <section className="space-y-3 pt-6 border-t border-white/10">
                <h2 className="text-base font-bold text-white tracking-tight">Delete Account</h2>
                <p className="text-xs text-white/50">
                  If you no longer wish to use Opportia, you can permanently delete your account.
                </p>

                <button
                  type="button"
                  onClick={() => setDeleteAccountModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Delete My Account</span>
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
                <h2 className="text-base font-bold text-white tracking-tight">Display</h2>

                {/* 3 Preview Theme Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {/* 1. System */}
                  <div
                    onClick={() => setTheme("system")}
                    className={`cursor-pointer rounded-2xl border p-2.5 sm:p-3 transition-all ${
                      mode === "system"
                        ? "border-white bg-white/5 ring-1 ring-white"
                        : "border-white/10 hover:border-white/20 bg-[#141416]"
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
                      <span className="text-xs font-semibold text-white">System</span>
                      {mode === "system" && (
                        <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center">
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
                        ? "border-white bg-white/5 ring-1 ring-white"
                        : "border-white/10 hover:border-white/20 bg-[#141416]"
                    }`}
                  >
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#f0f0f2] p-1.5 flex flex-col justify-between shadow-inner">
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
                      <span className="text-xs font-semibold text-white">Light</span>
                      {mode === "light" && (
                        <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center">
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
                        ? "border-white bg-white/5 ring-1 ring-white"
                        : "border-white/10 hover:border-white/20 bg-[#141416]"
                    }`}
                  >
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#18181b] p-1.5 flex flex-col justify-between shadow-inner">
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
                      <span className="text-xs font-semibold text-white">Dark</span>
                      {mode === "dark" && (
                        <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Language Preference */}
                <div className="max-w-xs space-y-1.5 pt-2">
                  <label className="block text-xs text-white/50 font-medium">Language</label>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setToastMessage(`Language preference set to ${e.target.value}`);
                      setTimeout(() => setToastMessage(""), 2000);
                    }}
                    className="w-full bg-[#161618] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-white/30 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                  </select>
                </div>
              </section>

              {/* SECTION: Notifications */}
              <section className="space-y-6 pt-6 border-t border-white/10">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Notifications</h2>
                  <p className="text-xs text-white/50 mt-1">
                    Choose how you would like to be notified about updates, invites and subscriptions.
                  </p>
                </div>

                {/* Group 1: Events You Attend */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white/40 tracking-wider">Events You Attend</h3>
                  <div className="space-y-1.5">
                    {[
                      { key: "eventInvites", label: "Event Invites", icon: "✉️" },
                      { key: "eventReminders", label: "Event Reminders", icon: "⏰" },
                      { key: "eventBlasts", label: "Event Blasts", icon: "📢" },
                      { key: "eventUpdates", label: "Event Updates", icon: "🔄" },
                      { key: "feedbackRequests", label: "Feedback Requests", icon: "💬" },
                    ].map((item) => (
                      <NotificationRow
                        key={item.key}
                        label={item.label}
                        channels={notifications[item.key] || ["Email"]}
                        onToggle={(channel) => handleToggleNotificationChannel(item.key, channel)}
                      />
                    ))}
                  </div>
                </div>

                {/* Group 2: Events You Host */}
                <div className="space-y-2 pt-4">
                  <h3 className="text-xs font-semibold text-white/40 tracking-wider">Events You Host</h3>
                  <div className="space-y-1.5">
                    {[
                      { key: "guestRegistrations", label: "Guest Registrations", icon: "👥" },
                      { key: "feedbackResponses", label: "Feedback Responses", icon: "⭐" },
                    ].map((item) => (
                      <NotificationRow
                        key={item.key}
                        label={item.label}
                        channels={notifications[item.key] || ["Email"]}
                        onToggle={(channel) => handleToggleNotificationChannel(item.key, channel)}
                      />
                    ))}
                  </div>
                </div>

                {/* Group 3: Calendars You Manage */}
                <div className="space-y-2 pt-4">
                  <h3 className="text-xs font-semibold text-white/40 tracking-wider">Calendars You Manage</h3>
                  <div className="space-y-1.5">
                    {[
                      { key: "newMembers", label: "New Members", icon: "👤" },
                      { key: "eventSubmissions", label: "Event Submissions", icon: "📑" },
                    ].map((item) => (
                      <NotificationRow
                        key={item.key}
                        label={item.label}
                        channels={notifications[item.key] || ["Email"]}
                        onToggle={(channel) => handleToggleNotificationChannel(item.key, channel)}
                      />
                    ))}
                  </div>
                </div>

                {/* Group 4: Opportia Updates */}
                <div className="space-y-2 pt-4">
                  <h3 className="text-xs font-semibold text-white/40 tracking-wider">Opportia</h3>
                  <div className="space-y-1.5">
                    <NotificationRow
                      label="Product Updates"
                      channels={notifications.productUpdates || ["Email"]}
                      onToggle={(channel) => handleToggleNotificationChannel("productUpdates", channel)}
                    />
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
                <h2 className="text-base font-bold text-white tracking-tight">Payment Methods</h2>
                <p className="text-xs text-white/50">
                  Your saved payment methods are encrypted and stored securely by Stripe.
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setAddCardModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Card</span>
                  </button>
                </div>

                {/* Saved Cards List */}
                {savedCards.length > 0 && (
                  <div className="pt-3 space-y-2">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-white/70" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {card.brand} •••• {card.last4}
                              </span>
                              {card.isDefault && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/40">Expires {card.exp}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSavedCards(savedCards.filter((c) => c.id !== card.id));
                            setToastMessage("Card removed from your account");
                            setTimeout(() => setToastMessage(""), 2500);
                          }}
                          className="text-white/40 hover:text-red-400 p-1 transition-colors"
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
              <section className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white tracking-tight">Opportia Plus</h2>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
                  >
                    <span>Learn More</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-xs text-white/50">
                  Enjoy 0% platform fees, higher invite and admin limits, priority support, and more.
                </p>

                {/* Personal Calendar Level Card */}
                <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 flex items-center justify-between cursor-pointer hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full overflow-hidden relative bg-white/10">
                      <Image src={activeAvatar.src} alt="Avatar" fill className="object-cover" sizes="28px" />
                    </div>
                    <span className="text-xs font-bold text-white">Personal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </div>
                <p className="text-[11px] text-white/40">
                  Opportia Plus applies on the calendar level. Choose the desired calendar above to manage its Opportia Plus membership.
                </p>
              </section>

              {/* SECTION: Payment History */}
              <section className="space-y-4 pt-6 border-t border-white/10">
                <h2 className="text-base font-bold text-white tracking-tight">Payment History</h2>

                {/* Empty State: Perforated Receipt Graphic */}
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <ReceiptIllustration />
                  <h3 className="text-sm font-bold text-white mt-4 mb-1">No Payments</h3>
                  <p className="text-xs text-white/40 max-w-sm">
                    Your payments will appear here. To view Opportia Plus payments, select the corresponding calendar from the section above.
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#141416] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Choose Profile Avatar</h3>
                  <p className="text-xs text-white/50">Select one of the 6 official avatars for your profile.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white"
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
                          ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/50"
                          : "border-white/10 hover:border-white/20 bg-white/5"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden relative mb-2">
                        <Image src={avatar.src} alt={avatar.name} fill className="object-cover" sizes="56px" />
                      </div>
                      <span className="text-[11px] font-semibold text-white/90 text-center leading-tight">
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
      {/* MODAL 2: Add Card Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {addCardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#141416] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Add Payment Card</h3>
                  <p className="text-xs text-white/50">Secured with 256-bit Stripe encryption.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddCardModalOpen(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCard} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Card Number</label>
                  <div className="relative flex items-center">
                    <CreditCard className="w-4 h-4 text-white/40 absolute left-3.5" />
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
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white font-mono focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Expiration (MM/YY)</label>
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
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:border-white/30 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">CVC</label>
                    <input
                      required
                      maxLength={4}
                      type="password"
                      placeholder="•••"
                      value={cardForm.cvc}
                      onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1">Cardholder Name</label>
                  <input
                    required
                    type="text"
                    value={cardForm.name}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddCardModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#141416] border border-white/15 rounded-3xl p-6 shadow-2xl text-white space-y-4"
            >
              <h3 className="text-base font-bold">Add Additional Email</h3>
              <p className="text-xs text-white/50">
                You&apos;ll receive a confirmation link to verify ownership.
              </p>
              <input
                type="email"
                placeholder="secondary@example.com"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-white/30 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddEmailModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddEmailModalOpen(false);
                    setToastMessage("Verification link sent to " + newEmailInput);
                    setNewEmailInput("");
                    setTimeout(() => setToastMessage(""), 3000);
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
                >
                  Send Verification
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#141416] border border-white/15 rounded-3xl p-6 shadow-2xl text-white space-y-4"
            >
              <h3 className="text-base font-bold">Update Phone Number</h3>
              <p className="text-xs text-white/50">
                Enter your mobile number with country code. A verification OTP will be sent.
              </p>
              <input
                type="text"
                placeholder="+91 95691 29910"
                value={newPhoneInput}
                onChange={(e) => setNewPhoneInput(e.target.value)}
                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-white/30 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPhoneUpdateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneNumber(newPhoneInput);
                    setPhoneUpdateModalOpen(false);
                    setToastMessage("Phone number updated successfully!");
                    setTimeout(() => setToastMessage(""), 2500);
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
                >
                  Confirm & Update
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#141416] border border-red-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Delete Account</h3>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                This will permanently delete your account, event registrations, tickets, and private data in accordance with DPDP regulations. This action cannot be reversed.
              </p>
              <div>
                <label className="block text-xs text-white/50 mb-1">Enter your password to confirm:</label>
                <input
                  type="password"
                  placeholder="Your current password"
                  value={deletePasswordInput}
                  onChange={(e) => setDeletePasswordInput(e.target.value)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteAccountModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <SettingsPageInner />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS & BRAND ICONS
// ---------------------------------------------------------------------------

function NotificationRow({ label, channels, onToggle }) {
  const [open, setOpen] = useState(false);
  const options = ["Email", "WhatsApp", "Push"];

  return (
    <div className="p-3 rounded-2xl bg-[#141416] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 relative">
      <span className="text-xs font-semibold text-white/90">{label}</span>
      <div className="relative self-start sm:self-auto">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{channels.join(", ")}</span>
          <ChevronsUpDown className="w-3 h-3 text-white/40" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-[#1c1c1f] border border-white/15 p-2 shadow-2xl z-20 space-y-1">
            {options.map((opt) => {
              const active = channels.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onToggle(opt)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left transition-colors cursor-pointer"
                >
                  <span className={active ? "text-white font-bold" : "text-white/50"}>{opt}</span>
                  {active && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Perforated Receipt Graphic matching Screenshot 5
function ReceiptIllustration() {
  return (
    <svg width="68" height="76" viewBox="0 0 68 76" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40">
      <path
        d="M6 6C6 3.79086 7.79086 2 10 2H58C60.2091 2 62 3.79086 62 6V68L56 64L50 68L44 64L38 68L32 64L26 68L20 64L14 68L6 63V6Z"
        fill="#26262a"
        stroke="#4a4a50"
        strokeWidth="2"
      />
      {/* Receipt Lines */}
      <rect x="14" y="14" width="22" height="4" rx="2" fill="#52525b" />
      <rect x="14" y="24" width="38" height="4" rx="2" fill="#3f3f46" />
      <rect x="14" y="34" width="32" height="4" rx="2" fill="#3f3f46" />
      <line x1="14" y1="46" x2="54" y2="46" stroke="#52525b" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="50" cy="16" r="3" fill="#71717a" />
      <rect x="14" y="52" width="14" height="2" rx="1" fill="#52525b" />
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

function AppleIcon(props) {
  return (
    <svg viewBox="0 0 170 170" fill="currentColor" {...props}>
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.43-5.65-8.58-10.12-18.42-13.41-29.5-3.29-11.09-4.94-21.72-4.94-31.91 0-14.02 3.41-25.77 10.23-35.25 6.82-9.48 15.42-14.35 25.8-14.6 4.35 0 9.42 1.25 15.22 3.75 5.8 2.5 9.77 3.82 11.91 3.97 1.83-.15 6.03-1.54 12.6-4.17 6.57-2.63 12.18-3.82 16.83-3.58 12.87.64 23.36 5.56 31.47 14.76-11.19 6.78-16.66 16.27-16.42 28.47.24 9.69 3.96 17.76 11.16 24.21 7.2 6.45 15.75 10.13 25.65 11.04-2.22 6.86-5.01 13.6-8.36 20.21zM119.22 31.86c0-7.39 2.68-14.28 8.04-20.67 5.36-6.39 12.12-10.45 20.28-12.19.24 1.3.36 2.47.36 3.51 0 7.39-2.82 14.36-8.46 20.91-5.64 6.55-12.44 10.43-20.4 11.64.12-1.04.18-2.11.18-3.2z" />
    </svg>
  );
}

function ZoomIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.5 5.5A2.5 2.5 0 0 0 2 8v8a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 16 16V8a2.5 2.5 0 0 0-2.5-2.5h-9zm13 4.5v4l4.5 3V7l-4.5 3z" />
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
