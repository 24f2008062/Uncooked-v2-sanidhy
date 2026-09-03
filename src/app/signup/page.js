"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Sparkles, Loader2, User, Mail, MapPin, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    password: "",
    ageAttested18: false,
    acceptTerms: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Register with Supabase directly
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            department: formData.location,
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // If successful, push to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Signup submission error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0a0a]">
      
      {/* Left Column - Signup Form */}
      <div className="w-full lg:w-[48%] xl:w-[42%] flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 min-h-screen relative overflow-hidden">
        
        {/* Background ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
           <div className="absolute top-[10%] -left-32 w-[500px] h-[500px] bg-[rgba(244,114,182,0.04)] rounded-full blur-[100px]" />
           <div className="absolute bottom-[10%] -right-32 w-[500px] h-[500px] bg-[rgba(249,115,22,0.03)] rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[420px] mx-auto relative z-10 flex flex-col justify-center h-full py-6"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f472b6] to-[#f97316] flex items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.3)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">uncooked</span>
          </Link>

          {/* Headers */}
          <div className="mb-6">
            <h1 className="text-[28px] sm:text-[36px] leading-tight font-bold text-white mb-2 tracking-tight">
              Get Started with Uncooked
            </h1>
            <p className="text-[14px] text-gray-400 font-medium">
              Create your account to host, register, and discover campus events
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && (
              <button
                type="button"
                onClick={async () => {
                  const origin = window.location.origin;
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
                    },
                  });
                }}
                className="w-full py-3 rounded-2xl text-[14px] font-semibold bg-white text-black"
              >
                Sign Up with Google
              </button>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3">
              {/* Full Name */}
              <div className="relative group">
                <User className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-5 py-3 text-[14px] rounded-xl outline-none transition-all duration-300 bg-[#141414] border border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6]"
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="Campus Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-5 py-3 text-[14px] rounded-xl outline-none transition-all duration-300 bg-[#141414] border border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6]"
                />
              </div>

              {/* Campus / Location */}
              <div className="relative group">
                <MapPin className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Campus / Department (Optional)"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-11 pr-5 py-3 text-[14px] rounded-xl outline-none transition-all duration-300 bg-[#141414] border border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6]"
                />
              </div>

              <div className="relative group">
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Password (min 12 chars, letter + number)"
                  minLength={12}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 text-[14px] rounded-xl outline-none transition-all duration-300 bg-[#141414] border border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <label className="flex items-start gap-2 text-[11px] text-gray-400">
                <input
                  type="checkbox"
                  required
                  checked={formData.ageAttested18}
                  onChange={(e) => setFormData({ ...formData, ageAttested18: e.target.checked })}
                  className="mt-0.5"
                />
                I confirm that I am 18 years of age or older.
              </label>
              <label className="flex items-start gap-2 text-[11px] text-gray-400">
                <input
                  type="checkbox"
                  required
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  className="mt-0.5"
                />
                I agree to the Terms of Service and Privacy Policy.
              </label>
              <button
                type="submit"
                disabled={loading || !formData.ageAttested18 || !formData.acceptTerms}
                className="w-full py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 bg-gradient-to-r from-[var(--accent-orange)] to-amber-500 text-white shadow-lg hover:opacity-95 hover:-translate-y-0.5 mt-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account & Get Started"}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent-orange)] font-semibold hover:underline">
              Login
            </Link>
          </div>

          <p className="text-[11px] text-gray-500 mt-6 leading-relaxed">
            By registering, you agree to the <Link href="/terms" className="underline hover:text-white transition-colors">Terms of Use</Link>, <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Notice</Link>, and Cookie Notice.
          </p>
        </motion.div>
      </div>

      {/* Right Column - Showcase */}
      <div className="hidden lg:block w-full lg:w-[52%] xl:w-[58%] p-4 lg:p-6">
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
                 alt="Uncooked Event Platform"
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
