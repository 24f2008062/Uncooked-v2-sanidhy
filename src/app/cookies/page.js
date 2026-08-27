import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LEGAL } from "@/server/config/legal";

export const metadata = {
  title: "Cookie Notice — Uncooked",
};

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Cookie Notice
          </h1>
          <p className="text-sm text-gray-400 mb-8">Version {LEGAL.privacyVersion}</p>
          <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
            <p>Uncooked uses cookies that are required to operate the site. We do not use advertising or cross-site tracking cookies.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><span className="text-white">Session cookie</span> — keeps you signed in (HTTP-only, SameSite=Lax, Secure in production).</li>
              <li><span className="text-white">CSRF cookie</span> — protects authentication forms.</li>
              <li><span className="text-white">Theme preference</span> — stored locally in your browser, not used for advertising.</li>
            </ul>
            <p>You can delete cookies in your browser. If you delete the session cookie you will be signed out.</p>
            <p>Questions: {LEGAL.grievanceEmail}</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
