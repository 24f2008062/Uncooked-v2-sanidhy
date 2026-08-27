"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });
    const payload = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(payload.error?.message || "Reset failed");
      return;
    }
    router.push("/login");
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <p className="text-sm text-gray-400">Minimum 12 characters, with a letter and a number.</p>
      <input
        type="password"
        required
        minLength={12}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#2a2a2a]"
        placeholder="New password"
      />
      <button disabled={loading} className="w-full py-3 rounded-xl bg-[var(--accent-orange)] font-semibold">
        {loading ? "Updating…" : "Update password"}
      </button>
      {message && <p className="text-sm text-red-400">{message}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <Suspense fallback={<p>Loading…</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
