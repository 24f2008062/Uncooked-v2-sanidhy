export function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-uncooked.session-token"
    : "uncooked.session-token";
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
