import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, Lock, Server, CheckCircle2, Activity } from "lucide-react";
import { LEGAL } from "@/server/config/legal";

export const metadata = {
  title: "Security — Uncooked",
  description: "How Uncooked protects accounts and personal data.",
};

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">
                Security practices · honest status
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Platform <span className="gradient-text">Security</span>
            </h1>
            <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              This page describes controls that are actually in place. We do not claim PCI-DSS certification, 99.99% uptime, or completed third-party penetration tests.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">What we implement today</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["Passwords", "scrypt with unique salt. Minimum 12 characters with a letter and a number. Plaintext storage is rejected."],
                  ["Sessions", "HTTP-only cookies, 7-day maximum, token version revoked on lock, role change, password reset, and erasure."],
                  ["Access control", "Role checks on the server. Event, host, and opportunity writes require a signed-in user. Admin APIs require SUPER_ADMIN."],
                  ["Tickets", "QR payloads are HMAC-SHA256 signed on the server. The first 8 characters of an ID are not a signature."],
                  ["Abuse controls", "Origin checks on mutations, per-IP rate limits, account lockout after repeated failures, platform write-pause."],
                  ["Transport", "TLS is terminated by the hosting provider. We set HSTS, CSP, frame denial, and nosniff headers."],
                ].map(([title, body]) => (
                  <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
                      <p className="text-xs text-gray-400">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Payments</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Uncooked is not PCI-DSS certified and does not process cards on this version. When checkout is enabled, we will use a hosted payment partner so card data never touches our servers (PCI SAQ A model). Until then, do not send card numbers to us.
                </p>
              </div>
              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Report a vulnerability</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Email {LEGAL.grievanceEmail}. Please do not publicly disclose until we have had a reasonable chance to fix the issue. We do not currently run a paid bug bounty.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                  <Activity className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Monitoring</h2>
              </div>
              <p className="text-sm text-gray-400">
                Administrative actions are written to an audit log. We do not fabricate CPU or latency telemetry. Availability depends on the host and database provider; we do not advertise a public SLA on this page.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
