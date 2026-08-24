import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FileText, CheckCircle2, AlertCircle, Scale, CreditCard } from "lucide-react";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Effective August 2026</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              Clear, transparent guidelines for hosts and attendees. By accessing or using the Uncooked platform, you agree to be bound by these terms.
            </p>
          </div>

          <div className="space-y-6">
            {/* Section 1 */}
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Account Registration & Verification</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                To maintain the integrity of our zero-noise ecosystem, all event hosts must undergo our verification process. Attendees must provide accurate information when registering for events.
              </p>
              <ul className="grid sm:grid-cols-2 gap-4">
                {[
                  "Valid campus (.edu) email required for student events",
                  "Hosts must complete ID verification for paid ticketing",
                  "One individual per account policy",
                  "Accounts are non-transferable"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 2 */}
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Event Creation & Responsibilities</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                As a host on Uncooked, you are solely responsible for the planning, execution, and safety of your events. We provide the infrastructure; you provide the experience.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <Scale className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Compliance with Local Laws</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">Hosts must ensure all events comply with local regulations, venue rules, and campus guidelines. Uncooked reserves the right to unpublish events that violate safety policies.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Accurate Representation</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">Event details, ticketing prices, and included amenities must be accurately described. Misleading attendees may result in permanent account suspension.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Payments, Fees & Payouts</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Uncooked charges a standard infrastructure fee on all paid tickets to cover processing and platform maintenance. Payouts are initiated 48 hours after the successful completion of an event to protect against fraud. Hosts are responsible for handling attendee refund requests in accordance with their explicitly stated refund policy. In cases of event cancellation, full refunds will be automatically issued to all attendees.
              </p>
            </div>
            
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
