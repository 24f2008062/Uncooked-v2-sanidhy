import { createHmac, timingSafeEqual } from "crypto";
import { requireTicketHmacSecret } from "@/server/security/secrets";

function secret() {
  return requireTicketHmacSecret();
}

export function signTicketPayload({ registrationId, eventId, userId }) {
  const canonical = `${registrationId}.${eventId}.${userId}`;
  return createHmac("sha256", secret()).update(canonical).digest("base64url");
}

export function verifyTicketPayload({ registrationId, eventId, userId, sig }) {
  if (!sig || typeof sig !== "string") return false;
  const expected = signTicketPayload({ registrationId, eventId, userId });
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
