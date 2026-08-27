import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { EyeOff, UserSquare2, Share2, Settings2, Cookie, Scale, Mail } from "lucide-react";
import { LEGAL } from "@/server/config/legal";

export const metadata = {
  title: "Privacy Policy — Uncooked",
  description: "How Uncooked collects, uses, and erases personal data under the DPDP Act, 2023.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">
                Version {LEGAL.privacyVersion} · India · DPDP Act, 2023
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              {LEGAL.dataFiduciaryNotice} This notice explains what we collect, why, how long we keep it, and how you exercise your rights.
            </p>
          </div>

          <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <UserSquare2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Personal data we collect</h2>
              </div>
              <ul className="space-y-2">
                <li>Account: name, email, campus/department (optional), password hash (never plaintext).</li>
                <li>Host applications: organisation name, type, and notes you submit. We do not currently accept identity-document uploads.</li>
                <li>Event activity: registrations, waitlist status, and ticket identifiers.</li>
                <li>Opportunity applications: cover note and optional https portfolio URL.</li>
                <li>Support: contact form messages you send us.</li>
                <li>Security logs: hashed IP addresses, login timestamps, and audit actions. We do not sell personal data.</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
                  <EyeOff className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Purpose and lawful basis</h2>
              </div>
              <p className="mb-4">
                We process this data with your consent (account creation, terms, age attestation) and as reasonably necessary to provide the service you request: accounts, event registration, host review, and support. You may withdraw consent by deleting your account. Withdrawal does not affect processing already completed.
              </p>
              <ul className="space-y-2">
                <li>We do not use personal data for targeted advertising.</li>
                <li>We do not run third-party advertising cookies.</li>
                <li>Paid ticketing and card processing are not live. We do not store card numbers.</li>
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
                <div className="flex items-center gap-3 mb-4">
                  <Share2 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Sharing</h3>
                </div>
                <p>
                  Verified event hosts can see attendee name as needed to run a guest list. Processors (hosting, database) act on our instructions. We do not sell personal data. If we add a payment processor later, card data will be handled by that processor, not stored on Uncooked servers.
                </p>
              </div>
              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
                <div className="flex items-center gap-3 mb-4">
                  <Settings2 className="w-5 h-5 text-gray-300" />
                  <h3 className="text-lg font-bold text-white">Your rights (DPDP)</h3>
                </div>
                <p>
                  You may access and correct your profile, export a copy of your data, and request erasure from your dashboard. Erasure anonymises your account and invalidates sessions. Fraud-prevention records such as opaque registration IDs may be retained where required.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <h2 className="text-xl font-bold text-white mb-4">Children</h2>
              <p>
                Uncooked is for persons 18 years or older. We require an 18+ attestation at signup. If you believe a child has created an account, email {LEGAL.grievanceEmail} and we will erase it.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <h2 className="text-xl font-bold text-white mb-4">Retention and security</h2>
              <p className="mb-3">
                Active accounts are kept while you use the service. After erasure, personal fields are removed or replaced with non-identifying values. Passwords are stored with scrypt. Sessions expire after 7 days. Transport security is provided by the hosting platform (TLS). Database connections use TLS when the provider requires it.
              </p>
              <p>
                No security measure is perfect. If we become aware of a personal-data breach likely to affect you, we will notify the Data Protection Board of India and affected users as required by the DPDP Act, 2023.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Grievance officer</h3>
              </div>
              <p className="mb-2">
                Under the DPDP Act, 2023 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021:
              </p>
              <p className="text-white">
                {LEGAL.grievanceOfficerName}<br />
                {LEGAL.entityName}<br />
                Email: {LEGAL.grievanceEmail}
              </p>
              <p className="mt-3">
                We will acknowledge grievances and aim to resolve them within the timelines prescribed by applicable law. You may also write to {LEGAL.supportEmail} for product support.
              </p>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Cookie className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                We use strictly necessary cookies to keep you signed in and to remember theme preference. See our{" "}
                <a href="/cookies" className="underline text-white">Cookie Notice</a>. There is no advertising cookie wall because we do not run ad tracking.
              </p>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Data export and erasure: Dashboard → Privacy controls, or email {LEGAL.grievanceEmail}. Governing law: {LEGAL.governingLaw}.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
