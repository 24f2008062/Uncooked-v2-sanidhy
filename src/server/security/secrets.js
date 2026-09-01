/**
 * Resolve and validate secrets. Never fall back to a hardcoded value —
 * a known fallback lets anyone forge sessions.
 */
export function requireAuthSecret(env = process.env) {
  const secret = env.NEXTAUTH_SECRET;
  if (!secret || typeof secret !== "string") {
    throw new Error("NEXTAUTH_SECRET is not configured");
  }
  if (secret.length < 32) {
    throw new Error("NEXTAUTH_SECRET must be at least 32 characters");
  }
  const lowered = secret.toLowerCase();
  if (lowered.includes("dev_secret") || lowered.includes("change-me") || lowered.includes("fallback")) {
    throw new Error("NEXTAUTH_SECRET looks like a placeholder and is not allowed");
  }
  return secret;
}

export function requireTicketHmacSecret(env = process.env) {
  const value = env.TICKET_HMAC_SECRET;
  if (!value || typeof value !== "string" || value.length < 32) {
    throw new Error("TICKET_HMAC_SECRET is not configured (min 32 chars, separate from session secret)");
  }
  if (env.NEXTAUTH_SECRET && value === env.NEXTAUTH_SECRET) {
    throw new Error("TICKET_HMAC_SECRET must be different from NEXTAUTH_SECRET");
  }
  return value;
}
