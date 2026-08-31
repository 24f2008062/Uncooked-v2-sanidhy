"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "uncooked_cookie_ack_v1";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let show = false;
    try {
      show = !window.localStorage.getItem(KEY);
    } catch {
      show = true;
    }
    if (show) {
      queueMicrotask(() => setVisible(true));
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] max-w-3xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-[#111]/95 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 shadow-2xl">
        <p className="text-xs text-gray-300 leading-relaxed flex-1">
          We use necessary cookies to keep you signed in. We do not use advertising cookies.{" "}
          <Link href="/cookies" className="underline text-white">
            Cookie notice
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline text-white">
            privacy policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-orange)] text-white shrink-0"
        >
          OK
        </button>
      </div>
    </div>
  );
}
