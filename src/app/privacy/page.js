import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { EyeOff, UserSquare2, Share2, Settings2, Cookie, Scale, Mail, Shield, Clock, Baby, Globe2 } from "lucide-react";
import { DPDP, IT_INTERMEDIARY, LEGAL, RETENTION } from "@/server/config/legal";

export const metadata = {
  title: "Privacy Policy | Opportia",
  description:
    "Opportia privacy notice under the DPDP Act, 2023 and DPDP Rules, 2025 — collection, purpose, rights, retention, security, and grievance redressal.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 sm:pt-32 pb-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">
                Version {LEGAL.privacyVersion} · India · {DPDP.actShort} · {DPDP.rulesShort}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6" style={{ color: "var(--text-primary)" }}>
              Privacy <span className="gradient-text">Notice</span>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              {LEGAL.dataFiduciaryNotice} This notice is provided in clear language as required by Section 5 of the
              Act and Rule 3 of the {DPDP.rulesShort} (notified {DPDP.rulesNotifyDate}).
            </p>
          </div>

          <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
            <div className="p-5 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <UserSquare2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">1. Itemised personal data we collect</h2>
              </div>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <strong className="text-white">Account identifiers:</strong> name, email, optional campus/department
                  and club association, password hash (never plaintext).
                </li>
                <li>
                  <strong className="text-white">Consent &amp; age:</strong> 18+ attestation, Terms/Privacy acceptance
                  timestamps and versions, hashed IP at consent time.
                </li>
                <li>
                  <strong className="text-white">Host applications:</strong> organisation name, type, and notes you
                  submit (no Aadhaar or ID-document upload).
                </li>
                <li>
                  <strong className="text-white">Event activity:</strong> registrations, waitlist status, ticket
                  identifiers, check-in records.
                </li>
                <li>
                  <strong className="text-white">Opportunity applications:</strong> cover note and optional https
                  portfolio URL.
                </li>
                <li>
                  <strong className="text-white">Support / grievances:</strong> messages you send via contact or privacy
                  channels.
                </li>
                <li>
                  <strong className="text-white">Security telemetry:</strong> hashed IP addresses, login timestamps,
                  rate-limit keys, and admin audit actions.
                </li>
              </ul>
              <p className="mt-4">
                We do <strong className="text-white">not</strong> collect Aadhaar, biometrics, payment card PAN/CVV, or
                advertising profiles.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
                  <EyeOff className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">2. Purpose and consent</h2>
              </div>
              <p className="mb-4">
                We process personal data with your free, specific, informed, unconditional, and unambiguous consent
                (account creation, terms, age attestation) and as reasonably necessary to provide the service you
                request: accounts, event registration, host verification, opportunities, and support.
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li>We do not use personal data for targeted advertising or behavioural ads directed at children.</li>
                <li>We do not run third-party advertising cookies or sell personal data.</li>
                <li>Paid ticketing and card processing are not live; we do not store card numbers.</li>
                <li>
                  You may withdraw consent by erasing your account from Profile → Data rights, or by emailing{" "}
                  {LEGAL.grievanceEmail}. Withdrawal does not affect processing already completed lawfully.
                </li>
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
                <div className="flex items-center gap-3 mb-4">
                  <Share2 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">3. Sharing &amp; processors</h3>
                </div>
                <p>
                  Verified event hosts can see attendee name as needed for a guest list. Processors (hosting, database,
                  email delivery if configured) act on our instructions under reasonable security safeguards.{" "}
                  {DPDP.crossBorderNote}
                </p>
              </div>
              <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
                <div className="flex items-center gap-3 mb-4">
                  <Settings2 className="w-5 h-5 text-gray-300" />
                  <h3 className="text-lg font-bold text-white">4. Your rights (Rule 14)</h3>
                </div>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Access and correction — Profile page / API.</li>
                  <li>Data portability copy — Export my data on Profile.</li>
                  <li>Erasure — Erase my account on Profile (password re-auth).</li>
                  <li>Grievance — email {LEGAL.grievanceEmail} (SLA ≤ {DPDP.grievanceSlaDays} days).</li>
                  <li>
                    Nomination — appoint a nominee on Profile to exercise rights if you cannot (DPDP Act / Rules).
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-4">
                <Clock className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold text-white">5. Retention (purpose limitation)</h2>
              </div>
              <ul className="space-y-2 list-disc pl-5">
                <li>{RETENTION.accountActive}</li>
                <li>{RETENTION.afterErasure}</li>
                <li>{RETENTION.securityLogs}</li>
                <li>{RETENTION.consents}</li>
                <li>{RETENTION.supportMessages}</li>
              </ul>
              <p className="mt-3">
                Where we initiate purpose-end erasure of dormant data, we will give advance notice of at least{" "}
                {DPDP.erasureAdvanceNoticeHours} hours where required by the Rules practice, unless erasure is at your
                request or legally mandated sooner.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-4">
                <Baby className="w-6 h-6 text-rose-400" />
                <h2 className="text-xl font-bold text-white">6. Children &amp; persons with disability</h2>
              </div>
              <p>
                Opportia is for persons <strong className="text-white">18 years or older</strong>. We require an 18+
                attestation at signup and do not knowingly process children&apos;s personal data. We do not engage in
                tracking or targeted advertising directed at children. If you believe a child has created an account,
                email {LEGAL.grievanceEmail} for erasure. Processing for a person with disability who has a lawful
                guardian requires verifiable guardian consent under the Rules — contact us before creating such an
                account.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-4">
                <Shield className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">7. Reasonable security safeguards (Rule 6)</h2>
              </div>
              <ul className="space-y-2 list-disc pl-5">
                <li>Passwords stored with scrypt; strong password policy; account lockout.</li>
                <li>HTTP-only session cookies; CSRF Origin checks; rate limiting; role-based access control.</li>
                <li>TLS in transit (hosting); security headers (HSTS, CSP, frame denial, nosniff).</li>
                <li>Access logging and admin audit trails retained per {RETENTION.securityLogs}</li>
                <li>See also <Link href="/security" className="underline text-white">Security</Link>.</li>
              </ul>
              <p className="mt-4">
                <strong className="text-white">Personal data breach:</strong> If we become aware of a personal data
                breach, we will intimate affected Data Principals without delay through registered channels, and inform
                the {DPDP.boardName} without delay, with a detailed report within {DPDP.breachBoardHours} hours (or a
                longer period allowed by the Board), as required by Section 8(6) of the Act and Rule 7 of the{" "}
                {DPDP.rulesShort}.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-4 mb-4">
                <Globe2 className="w-6 h-6 text-sky-400" />
                <h2 className="text-xl font-bold text-white">8. Cross-border transfers (Rule 15)</h2>
              </div>
              <p>{DPDP.crossBorderNote}</p>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">9. Grievance officer &amp; contacts (Rule 9 / IT Rules)</h3>
              </div>
              <p className="mb-2">
                Under the {DPDP.actShort}, {DPDP.rulesShort}, and the {IT_INTERMEDIARY.rulesShort}:
              </p>
              <p className="text-white">
                {LEGAL.grievanceOfficerName}
                <br />
                {LEGAL.entityName}
                <br />
                Grievance: {LEGAL.grievanceEmail}
                <br />
                Privacy questions: {LEGAL.privacyContactEmail}
                <br />
                Product support: {LEGAL.supportEmail}
              </p>
              <p className="mt-3">
                We will acknowledge and aim to resolve Data Principal grievances within a reasonable period{" "}
                <strong className="text-white">not exceeding {DPDP.grievanceSlaDays} days</strong>. You may escalate to
                the {DPDP.boardName} as provided under the Act after exhausting our redressal process.
              </p>
              <p className="mt-3 text-xs">
                How to exercise rights: signed-in Profile → Data rights, or email the grievance address with subject
                line <span className="text-white">DPDP Rights Request</span> and your registered email / user id.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[#111]">
              <h2 className="text-xl font-bold text-white mb-4">10. Intermediary due diligence (IT Act)</h2>
              <p className="mb-2">
                Opportia hosts user-generated event and opportunity listings. Upon receiving actual knowledge as defined
                under the {IT_INTERMEDIARY.rulesShort} ({IT_INTERMEDIARY.amendment2025}), we will remove or disable
                access to identified unlawful information within {IT_INTERMEDIARY.takedownHours} hours.{" "}
                {IT_INTERMEDIARY.actualKnowledgeNote}
              </p>
              <p>
                Report unlawful listings to {LEGAL.grievanceEmail}. See also our{" "}
                <Link href="/terms" className="underline text-white">
                  Terms of Service
                </Link>
                .
              </p>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Cookie className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                We use strictly necessary cookies to keep you signed in and to remember theme preference. See our{" "}
                <Link href="/cookies" className="underline text-white">
                  Cookie Notice
                </Link>
                . There is no advertising cookie wall because we do not run ad tracking.
              </p>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Governing law: {LEGAL.governingLaw}. Policy version {LEGAL.privacyVersion}. Significant Data Fiduciary
                (SDF) designation is by government notification based on volume/sensitivity — we are not claiming SDF
                status unless and until so notified.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
