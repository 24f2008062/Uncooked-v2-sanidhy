import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { sessionCookieName } from "@/server/config/authCookies";
import { getClientIp, fingerprintIp } from "@/server/http/clientIp";
import { rateLimit, rateLimitHeaders } from "@/server/http/rateLimit";

const ADMIN_PREFIXES = ["/admin", "/api/v2/admin"];
const AUTH_REQUIRED_PAGES = ["/dashboard", "/profile", "/host/apply"];
const PUBLIC_API_GET = [/^\/api\/events$/, /^\/api\/opportunities$/];

function isAdminPath(pathname) {
  return ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET || "uncooked_production_fallback_secret_32_chars_min";
  const ipKey = fingerprintIp(getClientIp(request), secret);

  if (pathname.startsWith("/api/auth") && request.method === "POST") {
    const rl = rateLimit(`mw_auth:${ipKey}`, 20, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", crypto.randomUUID());

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
