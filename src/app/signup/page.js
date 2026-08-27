"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, User, Mail, Phone, MapPin, Lock, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Call backend registration endpoint
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email?.trim().toLowerCase(),
          password: formData.password,
          department: formData.location,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // 2. Automatically log in after successful registration
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (loginRes?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
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
            {/* Google Signup Button */}
            <button
              type="button"
              onClick={() => signIn("google")}
              className="w-full py-3 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-3 transition-all duration-300 bg-white hover:bg-gray-100 text-black shadow-[0_4px_14px_rgba(255,255,255,0.1)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign Up with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#222]" />
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">or fill info</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#222]" />
            </div>

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

              {/* Phone Number */}
              <div className="relative group">
                <Phone className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  autoComplete="off"
                  placeholder="Phone Number (Optional)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

              {/* Password */}
              <div className="relative group">
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Password (min 6 chars)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-5 py-3 text-[14px] rounded-xl outline-none transition-all duration-300 bg-[#141414] border border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
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
