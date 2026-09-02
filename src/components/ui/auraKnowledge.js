/**
 * Aura guided replies: keep copy honest and aligned with live routes.
 * No invented campus counts, PCI claims, wallet passes, or live voice calls.
 */

export const QUICK_ACTIONS = [
  "Find campus events",
  "How do I get a pass?",
  "Apply to host",
  "Opportunities",
  "Account & privacy",
  "Contact support",
];

const DEFAULT_REPLY =
  "I can help with events, passes, hosting, opportunities, and your account. Try a quick action below, or ask about something on Uncooked.";

/** @type {{ test: (t: string) => boolean, reply: string }[]} */
const RULES = [
  {
    test: (t) => /\b(hi|hello|hey|namaste)\b/.test(t) || t === "help",
    reply:
      "Hi. I'm Aura, Uncooked's guide. I point you to real pages on this site: events, passes, host apply, opportunities, and privacy controls. What do you need?",
  },
  {
    test: (t) =>
      /\b(find|browse|discover|list).*(event)|campus event|upcoming|fest|hackathon\b/.test(t) ||
      t.includes("find campus events"),
    reply:
      "Browse live events at /events. Open any card for details, capacity, and a pass after you sign in and register. We only show real listings, no fake attendance numbers.",
  },
  {
    test: (t) =>
      /\b(pass|ticket|rsvp|register|qr|check[- ]?in|checkin)\b/.test(t) ||
      t.includes("how do i get a pass"),
    reply:
      "Sign in, open an event at /events/[id], then register. Your signed pass (HMAC QR) appears on that page and in /dashboard for you only. Door scanning is shipping next. Today the pass proves a real registration.",
  },
  {
    test: (t) =>
      /\b(host|organi[sz]er|club|publish|create event|apply to host)\b/.test(t) ||
      t.includes("apply to host"),
    reply:
      "Clubs apply at /host/apply. An admin reviews KYC, then your role becomes ORGANIZER and you can publish from the host flow. Unverified hosts are not treated as official campus operators.",
  },
  {
    test: (t) =>
      /\b(opportunit|job|hiring|internship|recruit)\b/.test(t) || t.includes("opportunities"),
    reply:
      "Open /opportunities for campus roles tied to the same trusted journey as events. Sign in to apply. We never ask you to paste passwords into chat.",
  },
  {
    test: (t) =>
      /\b(account|profile|dashboard|privacy|dpdp|erase|export|data|gdpr)\b/.test(t) ||
      t.includes("account & privacy"),
    reply:
      "Use /dashboard for your passes and applications, and /profile to update details, export your data, or erase your account (password confirmation required). You must be 18+ and accept Terms/Privacy to join.",
  },
  {
    test: (t) =>
      /\b(login|sign ?in|sign ?up|register account|password|forgot)\b/.test(t),
    reply:
      "Create an account at /signup or sign in at /login. Forgot password? Use /forgot-password. Reset links are emailed; we never show tokens in production responses.",
  },
  {
    test: (t) =>
      /\b(price|pricing|paid|fee|razorpay|stripe|cost|free)\b/.test(t) ||
      t.includes("ticketing"),
    reply:
      "Student discovery and free RSVPs stay free. Paid take-rate only after check-in trust is real. Card rails are planned later via hosted checkout. Aura will not invent PCI or wallet claims.",
  },
  {
    test: (t) => /\b(call|voice|phone|ring|dial)\b/.test(t),
    reply:
      "I only chat in this widget, no voice calls. For a human, use /contact. For account issues, try /profile or /forgot-password.",
  },
  {
    test: (t) =>
      /\b(contact|support|help desk|grievance|demo|book)\b/.test(t) ||
      t.includes("contact support"),
    reply:
      "Reach the team at /contact (Host Verification, Ticketing, Campus Partnership, Technical Support, or General). For privacy grievances, use the officer details on /privacy.",
  },
  {
    test: (t) => /\b(admin|super.?admin|kill.?switch)\b/.test(t),
    reply:
      "Admin tools are only for SUPER_ADMIN at /admin. I cannot elevate roles or flip the kill switch from chat. If you need access, contact your campus operator through /contact.",
  },
  {
    test: (t) => /\b(security|csrf|safe|scam|phish)\b/.test(t),
    reply:
      "Uncooked uses signed sessions, CSRF origin checks, rate limits, and scrypt passwords. Never share your password in this chat. If something looks off, go to /security or /contact.",
  },
  {
    test: (t) => /\b(aura|who are you|llm|gpt|ai)\b/.test(t),
    reply:
      "I'm a guided helper on Uncooked: short, campus-operational answers about what this site actually does. I'm not a free-form LLM and I don't run voice calls.",
  },
];

export function normalizeAuraQuery(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getAuraReply(rawText) {
  const t = normalizeAuraQuery(rawText);
  if (!t) return DEFAULT_REPLY;
  for (const rule of RULES) {
    if (rule.test(t)) return rule.reply;
  }
  return DEFAULT_REPLY;
}
