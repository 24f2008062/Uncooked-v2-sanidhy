import { createHmac, timingSafeEqual } from "crypto";
import { requireTicketHmacSecret } from "@/server/security/secrets";

function secret() {
  try {
    return requireTicketHmacSecret();
  } catch {
    const fallback = process.env.NEXTAUTH_SECRET;
    if (fallback && typeof fallback === "string" && fallback.length >= 32) {
      return createHmac("sha256", fallback)
        .update("uncooked-ticket-pass-hmac-domain-v1")
        .digest("hex");
    }
    return "uncooked-dev-ticket-hmac-secret-min-32-chars-long";
  }
}

export function signTicketPayload({ registrationId, eventId, userId }) {
  if (!registrationId || !eventId || !userId) {
    return "";
  }
  const canonical = `${registrationId}.${eventId}.${userId}`;
  return createHmac("sha256", secret()).update(canonical).digest("base64url");
}

export function safeSignTicketPayload({ registrationId, eventId, userId }) {
  try {
    return signTicketPayload({ registrationId, eventId, userId });
  } catch {
    return "";
  }
}

export function verifyTicketPayload({ registrationId, eventId, userId, sig }) {
  if (!sig || typeof sig !== "string") return false;
  try {
    const expected = signTicketPayload({ registrationId, eventId, userId });
    if (!expected) return false;
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
