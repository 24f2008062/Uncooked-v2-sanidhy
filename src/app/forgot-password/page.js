"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devPath, setDevPath] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setDevPath("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await res.json();
      setMessage(payload.data?.message || payload.error?.message || "Request submitted.");
      if (payload.data?.devResetPath) setDevPath(payload.data.devResetPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold">Reset password</h1>
        <p className="text-sm text-gray-400">Enter your email. If an account exists, we will issue a reset path.</p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#2a2a2a]"
          placeholder="you@university.edu"
        />
        <button disabled={loading} className="w-full py-3 rounded-xl bg-[var(--accent-orange)] font-semibold">
          {loading ? "Sending…" : "Continue"}
        </button>
        {message && <p className="text-sm text-gray-300">{message}</p>}
        {devPath && (
          <p className="text-xs text-amber-300 break-all">
            Local reset link: <Link href={devPath} className="underline">{devPath}</Link>
          </p>
        )}
        <Link href="/login" className="text-sm text-[var(--accent-orange)]">Back to login</Link>
      </form>
    </main>
  );
}
