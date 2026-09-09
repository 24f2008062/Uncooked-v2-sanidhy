import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FileText, CheckCircle2, AlertCircle, Scale, Shield } from "lucide-react";
import { DPDP, IT_INTERMEDIARY, LEGAL } from "@/server/config/legal";

export const metadata = {
  title: "Terms of Service | Opportia",
  description: "Terms of Service for the Opportia campus events platform under Indian law.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 sm:pt-32 pb-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">
                Version {LEGAL.termsVersion} · India
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6" style={{ color: "var(--text-primary)" }}>
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              These terms govern use of Opportia. By creating an account or using the site, you agree to them. If you do
              not agree, do not use the service. Personal data is processed under our{" "}
              <Link href="/privacy" className="underline text-white">
                Privacy Notice
              </Link>{" "}
              ({DPDP.actShort} and {DPDP.rulesShort}).
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-5 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Eligibility and accounts</h2>
              </div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>You must be 18 or older. We require an 18+ attestation at registration (children&apos;s data rules).</li>
                <li>Provide accurate information. One person per account. Accounts are not transferable.</li>
                <li>You are responsible for keeping your password confidential. We will never ask for it by email.</li>
                <li>
                  We may lock or disable accounts that abuse the service, attempt unauthorised access, or post unlawful
                  content, consistent with the Information Technology Act, 2000 and intermediary due diligence.
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Events, hosts, and listings</h2>
              </div>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <Scale className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Host responsibility</h4>
                    <p className="text-xs leading-relaxed">
                      Hosts are solely responsible for event safety, venue rules, campus policy, and local law. Opportia
                      provides software, not event operations. We may unpublish events that appear unsafe, misleading, or
                      unlawful.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Accurate listings</h4>
                    <p className="text-xs leading-relaxed">
                      Event details must be accurate. Creating events requires a verified organiser role. Paid ticketing,
                      SMS delivery, and wallet passes are not currently offered.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Intermediary due diligence (IT Rules 2025)</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Opportia is an intermediary for user-generated event and opportunity content under the Information
                Technology Act, 2000 and the {IT_INTERMEDIARY.rulesShort}. Amendment reference:{" "}
                {IT_INTERMEDIARY.amendment2025}.
              </p>
              <ul className="space-y-2 text-sm text-gray-400 list-disc pl-5 mb-4">
                <li>
                  Upon actual knowledge as defined in the Rules, we will remove or disable access to identified unlawful
                  information within <strong className="text-white">{IT_INTERMEDIARY.takedownHours} hours</strong>.
                </li>
                <li>{IT_INTERMEDIARY.actualKnowledgeNote}</li>
                <li>
                  Report unlawful content to {LEGAL.grievanceEmail} with the specific URL or listing identifier where
                  possible.
                </li>
                <li>
                  Grievance Officer: {LEGAL.grievanceOfficerName} — {LEGAL.grievanceEmail}. Privacy grievances under DPDP
                  are handled within {DPDP.grievanceSlaDays} days.
                </li>
              </ul>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Card and UPI checkout are not enabled on this version of the platform. Do not submit payment card data to
                Opportia. When payments launch, they will be processed by a licensed payment partner and these terms will
                be updated.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                You may not probe, overload, or circumvent access controls; post malware; harvest other users&apos; data;
                or use the service for unlawful content. We may pause writes (including registrations) during a security
                incident.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                The service is provided as available. We do not warrant uninterrupted operation. To the extent permitted
                by Indian law, {LEGAL.entityName} is not liable for host-run events, venue incidents, or indirect
                losses. These terms are governed by {LEGAL.governingLaw}. Grievances: {LEGAL.grievanceEmail}.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
