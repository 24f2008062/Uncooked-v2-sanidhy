export function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-opportia.session-token"
    : "opportia.session-token";
}

export function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
  };
}

/**
 * Force safe flags on Supabase SSR auth cookies.
 * Production login was emitting sb-*-auth-token without HttpOnly/Secure.
 */
export function hardenSupabaseCookieOptions(options = {}) {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return {
    ...options,
    path: options.path || "/",
    sameSite: options.sameSite || "lax",
    httpOnly: true,
    httpOnly: options.httpOnly ?? false,
    secure: isProd ? true : Boolean(options.secure),
  };
}
