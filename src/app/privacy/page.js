import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { EyeOff, UserSquare2, Share2, Settings2, Cookie } from "lucide-react";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Effective August 2026</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              Your data belongs to you. We believe in complete transparency regarding how we collect, use, and protect your information on the Uncooked platform.
            </p>
          </div>

          <div className="space-y-6">
            {/* Section 1 */}
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <UserSquare2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Information We Collect</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                We only collect the essential data required to provide you with a seamless event discovery and management experience.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <h4 className="text-sm font-semibold text-white mb-2">Account Data</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Name, email address, campus affiliation, and profile preferences used to personalize your event feed.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <h4 className="text-sm font-semibold text-white mb-2">Telemetry Data</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Anonymous usage metrics, device information, and diagnostic logs to ensure our zero-noise infrastructure remains stable.</p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
                  <EyeOff className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">How We Use Your Data</h2>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  "Processing ticket purchases and secure QR generation",
                  "Preventing fraud and unauthorized event access",
                  "Improving our event discovery algorithms",
                  "Sending critical updates regarding your registered events"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 3 */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Share2 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Data Sharing</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  We do not sell your personal data. We only share necessary information (like your name) with verified Event Hosts so they can manage their guest lists and ensure campus security protocols are met.
                </p>
              </div>

              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Settings2 className="w-5 h-5 text-gray-300" />
                  <h3 className="text-lg font-bold text-white">Your Rights & Controls</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  You retain full control over your data. You can export your event history, adjust your privacy settings, or permanently delete your Uncooked account at any time through your dashboard.
                </p>
              </div>
            </div>

            {/* Cookies Note */}
            <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Cookie className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                We use strictly necessary cookies to keep you logged in and functional cookies to remember your preferences. We do not use third-party tracking cookies for targeted advertising.
              </p>
            </div>
            
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
