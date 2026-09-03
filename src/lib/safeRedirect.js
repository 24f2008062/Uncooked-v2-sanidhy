/**
 * Only allow same-app relative paths. Blocks open redirects like //evil.com,
 * /\evil.com, https://evil.com, and protocol-relative URLs.
 */
export function safeInternalPath(candidate, fallback = "/dashboard") {
  if (typeof candidate !== "string") return fallback;
  const value = candidate.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  if (/^\/\\/i.test(value)) return fallback;
  if (value.includes("://")) return fallback;
  if (/[\x00-\x1f\x7f]/.test(value)) return fallback;
  // Disallow scheme-looking segments after the first slash (e.g. /http:/evil)
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;
  return value;
}
