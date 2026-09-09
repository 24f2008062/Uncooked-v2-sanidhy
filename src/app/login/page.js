"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/SupabaseProvider";
import { motion } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { safeInternalPath } from "@/lib/safeRedirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeInternalPath(searchParams.get("redirectTo"), "/dashboard");
  const { refreshSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // "google" | "github" | null
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const supabase = createClient();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth_callback_failed") {
      setErrorMsg("Social sign-in failed or was cancelled. Please try again.");
    } else if (errorParam === "app_url_misconfigured") {
      setErrorMsg("Authentication callback misconfigured. Please check environment configuration.");
    }
  }, [searchParams]);

  const handleOAuthLogin = async (provider) => {
    setOauthLoading(provider);
    setErrorMsg("");

    try {
      const origin = window.location.origin;
      const target = safeInternalPath(redirectTo, "/dashboard");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(target)}`,
        },
      });

      if (error) {
        setErrorMsg(error.message || `Failed to sign in with ${provider}.`);
        setOauthLoading(null);
      }
    } catch (err) {
      setErrorMsg(`Could not connect to ${provider}. Please try again.`);
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Server-side login: CSRF, rate limit, lockout, uniform errors, session cookies.
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        if (res.status === 429) {
          setErrorMsg("Too many sign-in attempts. Please wait and try again.");
        } else if (res.status === 503) {
          setErrorMsg(
            data.error?.message ||
              "Sign-in is temporarily unavailable. Please try again shortly."
          );
        } else {
          setErrorMsg(data.error?.message || "Invalid email or password. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Server set cookies — refresh client session so Navbar hides Login/Get Started.
      await refreshSession?.();
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setErrorMsg("Failed to log in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0a0a]">
      
      {/* Left Column - Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-4 sm:px-12 lg:px-24 py-8 sm:py-12 min-h-screen relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
           <div className="absolute top-[10%] -left-32 w-[500px] h-[500px] bg-[rgba(244,114,182,0.04)] rounded-full blur-[100px]" />
           <div className="absolute bottom-[10%] -right-32 w-[500px] h-[500px] bg-[rgba(249,115,22,0.03)] rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[400px] mx-auto relative z-10 flex flex-col justify-center h-full"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 sm:mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f472b6] to-[#f97316] flex items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.3)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">OPPORTIA</span>
          </Link>

          {/* Headers */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-[28px] sm:text-[40px] leading-tight font-bold text-white mb-2 tracking-tight">
              Login to Opportia
            </h1>
            <p className="text-[15px] text-gray-400 font-medium">
              Access your campus events, passes, and host dashboard
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Social OAuth Providers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={loading || oauthLoading !== null}
                onClick={() => handleOAuthLogin("google")}
                className="w-full py-3 px-3.5 rounded-2xl text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 bg-white hover:bg-gray-100 text-black border border-gray-200 shadow-sm active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {oauthLoading === "google" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                )}
                <span>Google</span>
              </button>

              <button
                type="button"
                disabled={loading || oauthLoading !== null}
                onClick={() => handleOAuthLogin("github")}
                className="w-full py-3 px-3.5 rounded-2xl text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 bg-[#161b22] hover:bg-[#21262d] text-white border border-[#30363d] shadow-sm active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {oauthLoading === "github" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <GitHubIcon className="w-4 h-4 shrink-0" />
                )}
                <span>GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2a2a2a]" />
              </div>
              <span className="relative px-3 bg-[#0a0a0a] text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                or with email
              </span>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3">
              <div className="relative group">
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="you@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-5 py-3.5 text-[15px] rounded-2xl outline-none transition-all duration-300 bg-[#141414] border border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6] group-hover:border-[#333]"
                />
              </div>

              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-5 py-3.5 pr-12 text-[15px] rounded-2xl outline-none transition-all duration-300 bg-[#141414] border border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6] group-hover:border-[#333]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-white">
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 bg-[var(--accent-orange)] hover:opacity-90 text-white shadow-lg hover:-translate-y-0.5 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login to Account"}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[var(--accent-orange)] font-semibold hover:underline">
              Get Started
            </Link>
          </div>

          <p className="text-[12px] text-gray-500 mt-8 leading-relaxed">
            By logging in, you agree to the <Link href="/terms" className="underline hover:text-white transition-colors">Terms of Use</Link>, <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Notice</Link>, and Cookie Notice.
          </p>
        </motion.div>
      </div>

      {/* Right Column - Showcase */}
      <div className="hidden lg:block w-full lg:w-[55%] xl:w-[60%] p-4 lg:p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full h-full min-h-[calc(100vh-3rem)] bg-[#111] border border-[#222] rounded-[32px] flex items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-[radial-gradient(circle,rgba(249,115,22,0.05)_0%,transparent_60%)] blur-[60px]" />
          
          <div className="relative z-10 w-[85%] h-[85%] border border-[rgba(255,255,255,0.06)] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-[#0a0a0a]">
             <div className="w-full h-12 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] flex items-center px-4 gap-2 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
               <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
               <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
               <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
             </div>
             
             <div className="flex-1 relative w-full h-full mt-12">
               <Image 
                 src="/events/EVENT IMAGE.jpg"
                 alt="OPPORTIA Product Showcase"
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <LoginForm />
    </Suspense>
  );
}

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

function GitHubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}
