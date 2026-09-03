"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Sparkles, Loader2, Mail, AlertCircle, ArrowLeft, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import Image from "next/image";

const jakartaFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devPath, setDevPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMsg("");
    setDevPath("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await res.json();
      
      if (!res.ok) {
        setErrorMsg(payload.error?.message || "Failed to send reset link. Please try again.");
        setIsSuccess(false);
      } else {
        setMessage(payload.data?.message || "Password reset request submitted successfully.");
        setIsSuccess(true);
        if (payload.data?.devResetPath) setDevPath(payload.data.devResetPath);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setErrorMsg("An unexpected error occurred. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0a0a] ${jakartaFont.className}`}>
      {/* Left Column - Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 min-h-screen relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[10%] -left-32 w-[500px] h-[500px] bg-[rgba(244,114,182,0.05)] rounded-full blur-[110px]" />
          <div className="absolute bottom-[10%] -right-32 w-[500px] h-[500px] bg-[rgba(249,115,22,0.04)] rounded-full blur-[110px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px] mx-auto relative z-10 flex flex-col justify-center h-full"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f472b6] to-[#f97316] flex items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.3)] transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">uncooked</span>
          </Link>

          {!isSuccess ? (
            <>
              {/* Header & Prompt with Proper Font */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] text-xs font-semibold text-[#f472b6] mb-4">
                  <KeyRound className="w-3.5 h-3.5" />
                  Account Recovery
                </div>
                <h1 className="text-[30px] sm:text-[36px] leading-tight font-extrabold text-white mb-3 tracking-tight">
                  Forgot Password?
                </h1>
                <p className="text-[14px] leading-relaxed text-gray-400 font-normal">
                  Enter your registered campus email address below. We&apos;ll send you instructions to safely reset your password.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="relative group">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#f472b6] transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full pl-11 pr-4 py-3.5 text-[14px] rounded-2xl outline-none transition-all duration-300 bg-[#141414] border border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 bg-gradient-to-r from-[var(--accent-orange)] to-amber-500 hover:opacity-95 text-white shadow-lg hover:-translate-y-0.5 cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Request…</span>
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="p-6 rounded-3xl bg-[#141414] border border-[#262626] text-center space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                  {message || `We sent a password reset link to ${email}. Please check your inbox and spam folder.`}
                </p>
              </div>

              {devPath && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
                  <p className="text-[11px] font-medium text-amber-300 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Local Dev Reset Shortcut
                  </p>
                  <Link
                    href={devPath}
                    className="text-xs text-amber-400 underline font-mono break-all hover:text-amber-200"
                  >
                    Click to Reset Password Directly
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setMessage("");
                  setDevPath("");
                }}
                className="text-xs text-gray-400 hover:text-white underline transition-colors pt-2"
              >
                Try another email
              </button>
            </motion.div>
          )}

          {/* Footer Back Link */}
          <div className="mt-8 pt-4 border-t border-[#1f1f1f] flex items-center justify-between text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
            <Link href="/signup" className="text-[var(--accent-orange)] font-medium hover:underline">
              Create new account
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Showcase Panel */}
      <div className="hidden lg:block w-full lg:w-[55%] xl:w-[60%] p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full h-full min-h-[calc(100vh-3rem)] bg-[#111] border border-[#222] rounded-[32px] flex items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-[radial-gradient(circle,rgba(244,114,182,0.06)_0%,transparent_60%)] blur-[60px]" />

          <div className="relative z-10 w-[85%] h-[85%] border border-[rgba(255,255,255,0.06)] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-[#0a0a0a]">
            <div className="w-full h-12 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] flex items-center px-4 gap-2 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>

            <div className="flex-1 relative w-full h-full mt-12">
              <Image
                src="/events/EVENT IMAGE.jpg"
                alt="Uncooked Platform Showcase"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
