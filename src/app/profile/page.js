"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/SupabaseProvider";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountNav from "@/components/account/AccountNav";
import { Loader2, Save, Shield, Download, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

const INTEREST_OPTIONS = [
  "Hackathons",
  "Workshops",
  "Cultural Fests",
  "Sports & Gaming",
  "Startups",
  "Music",
  "Tech",
];

function parseInterests(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    department: "",
    clubAssociation: "",
    interests: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((payload) => {
        if (!payload.success) {
          setError(payload.error?.message || "Unable to load profile");
          return;
        }
        const next = payload.data.user;
        setUser(next);
        setForm({
          fullName: next.fullName || next.name || "",
          department: next.department || "",
          clubAssociation: next.clubAssociation || "",
          interests: parseInterests(next.interests),
        });
      })
      .catch(() => setError("Unable to load profile"))
      .finally(() => setLoading(false));
  }, [status]);

  const toggleInterest = (interest) => {
    setForm((prev) => {
      const has = prev.interests.includes(interest);
      const interests = has
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest].slice(0, 8);
      return { ...prev, interests };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          name: form.fullName,
          department: form.department,
          clubAssociation: form.clubAssociation,
          interests: form.interests,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error?.message || "Could not save profile");
        return;
      }
      setUser(payload.data.user);
      setMessage("Profile saved");
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    const res = await fetch("/api/user/export");
    const payload = await res.json();
    if (!payload.success) {
      setError(payload.error?.message || "Export failed");
      return;
    }
    const blob = new Blob([JSON.stringify(payload.data.export, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uncooked-data-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const eraseAccount = async () => {
    if (!window.confirm("This permanently erases your personal data and signs you out. Continue?")) return;
    const password = window.prompt("Enter your current password to confirm account erasure:");
    if (!password) return;
    setBusy(true);
    const res = await fetch("/api/user/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = await res.json();
    setBusy(false);
    if (!payload.success) {
      setError(payload.error?.message || "Erasure failed");
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <>
      <Navbar forceDarkTop />
      <main className="min-h-screen bg-primary pt-28 pb-24 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-pink-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">Your profile</h1>
          <p className="text-sm text-text-secondary mb-6">
            Email and role cannot be changed here. That protects account takeover and privilege escalation.
          </p>
          <AccountNav />

          {loading ? (
            <div className="flex items-center gap-2 text-text-secondary py-16 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </p>
              )}
              {message && (
                <p className="text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {message}
                </p>
              )}

              <form onSubmit={save} className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Full name
                    </label>
                    <input
                      required
                      maxLength={80}
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--accent-orange)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Email
                    </label>
                    <input
                      readOnly
                      value={user?.email || session?.user?.email || ""}
                      className="w-full bg-background/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-secondary cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Campus / department
                    </label>
                    <input
                      maxLength={120}
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--accent-orange)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Club association
                    </label>
                    <input
                      maxLength={120}
                      value={form.clubAssociation}
                      onChange={(e) => setForm({ ...form, clubAssociation: e.target.value })}
                      className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--accent-orange)]"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Role</p>
                  <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 border border-white/10 text-text-primary">
                    {user?.role || session?.user?.role}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => {
                      const active = form.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            active
                              ? "bg-[var(--accent-orange)] text-white border-transparent"
                              : "bg-background text-text-secondary border-border-subtle"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save profile
                </button>
              </form>

              <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border-subtle space-y-4">
                <div className="flex items-center gap-2 text-text-primary font-bold text-sm">
                  <Shield className="w-4 h-4 text-[var(--accent-orange)]" />
                  Data rights (DPDP)
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Export a copy of your personal data, or erase this account. Erasure invalidates every session.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={exportData}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border-subtle text-xs font-semibold text-text-primary"
                  >
                    <Download className="w-4 h-4" /> Export my data
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={eraseAccount}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Erase my account
                  </button>
                </div>
              </section>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
