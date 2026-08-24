import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, Lock, Server, CheckCircle2, Activity } from "lucide-react";

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">System Status: Secure</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Enterprise-Grade <span className="gradient-text">Security</span>
            </h1>
            <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              Protecting your campus ecosystem and event data is our highest priority. We utilize state-of-the-art infrastructure to ensure zero-noise operations and bulletproof security.
            </p>
          </div>

          <div className="space-y-6">
            {/* Section 1 */}
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Data Encryption</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                All infrastructure telemetry, user data, and ticketing information is secured using industry-leading encryption standards to prevent unauthorized access.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">In Transit</h4>
                    <p className="text-xs text-gray-400">All data transmitted between your device and our servers is encrypted using TLS 1.3.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">At Rest</h4>
                    <p className="text-xs text-gray-400">Databases and backups are encrypted at rest using AES-256 block-level encryption.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Infrastructure</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Our architecture is deployed across multiple isolated regions to ensure 99.99% uptime. We utilize automated failovers and real-time DDoS mitigation to keep your events online, even during massive traffic spikes.
                </p>
              </div>

              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Payment Security</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Uncooked is fully PCI-DSS compliant. We partner with Stripe to process all transactions securely. We never store raw credit card numbers or sensitive financial data on our servers.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                  <Activity className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Continuous Monitoring & Auditing</h2>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                  <span className="text-sm text-gray-300">24/7 automated telemetry monitoring for suspicious activity.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                  <span className="text-sm text-gray-300">Strict Role-Based Access Control (RBAC) internally and for event hosts.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                  <span className="text-sm text-gray-300">Routine third-party penetration testing and vulnerability scanning.</span>
                </li>
              </ul>
            </div>
            
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
