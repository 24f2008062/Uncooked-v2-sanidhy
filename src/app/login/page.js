"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { safeInternalPath } from "@/lib/safeRedirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeInternalPath(searchParams.get("redirectTo"), "/dashboard");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const supabase = createClient();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth_callback_failed") {
      setErrorMsg("Google sign-in failed or was cancelled. Please try again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    console.log("[AUTH_LOGIN] Login started");
    console.log("[AUTH_LOGIN] Email:", formData.email);

    try {
      const loginRes = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      let error = loginRes.error;

      console.log("[AUTH_LOGIN] Success:", !loginRes.error);
      console.log("[AUTH_LOGIN] User ID:", loginRes.data?.user?.id || null);
      console.log("[AUTH_LOGIN] Session exists:", !!loginRes.data?.session);
      console.log("[AUTH_LOGIN] Error code:", loginRes.error?.status || loginRes.error?.code || null);
      console.log("[AUTH_LOGIN] Error message:", loginRes.error?.message || null);

      // If standard login fails, try the JIT migration fallback
      if (error && error.message.toLowerCase().includes("invalid login credentials")) {
        try {
          const migrateRes = await fetch("/api/auth/migrate-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email, password: formData.password }),
          });
          
          if (migrateRes.ok) {
            // Migration successful! Their password is now updated in Supabase. Let's retry the login.
            const retryLogin = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password,
            });
            error = retryLogin.error;
          }
        } catch (migrateErr) {
          console.error("Migration fallback failed:", migrateErr);
        }
      }

      if (error) {
        try {
          const checkRes = await fetch("/api/auth/check-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email }),
          });
          const checkData = await checkRes.json();
          if (checkData.success && checkData.exists === false) {
            setErrorMsg("No account found with this email address. Please check your typing or register a new account.");
          } else {
            setErrorMsg("Incorrect password. Please verify your password or click 'Forgot password?' to reset.");
          }
        } catch {
          setErrorMsg("Invalid email or password. Please try again.");
        }
        setLoading(false);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Failed to log in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0a0a]">
      
      {/* Left Column - Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 min-h-screen relative overflow-hidden">
        
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
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f472b6] to-[#f97316] flex items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.3)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">uncooked</span>
          </Link>

          {/* Headers */}
          <div className="mb-8">
            <h1 className="text-[32px] sm:text-[40px] leading-tight font-bold text-white mb-2 tracking-tight">
              Login to Uncooked
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

          <div className="space-y-4">
            {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && (
              <button
                type="button"
                onClick={async () => {
                  const origin = window.location.origin;
                  const target = safeInternalPath(redirectTo, "/dashboard");
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(target)}`,
                    },
                  });
                }}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-3 transition-all duration-300 bg-white hover:bg-gray-100 text-black"
              >
                Login with Google
              </button>
            )}

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
                 alt="Uncooked Product Showcase"
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
