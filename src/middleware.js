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

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: "Authentication is not configured" } },
        { status: 500 }
      );
    }
    return NextResponse.next();
  }

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

  const token = await getToken({
    req: request,
    secret,
    cookieName: sessionCookieName(),
  });

  if (isAdminPath(pathname)) {
    if (!token?.id || token.role !== "SUPER_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Administrator access required." } },
          { status: token ? 403 : 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (AUTH_REQUIRED_PAGES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (!token?.id) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/api/") && request.method !== "GET" && request.method !== "HEAD") {
    const isPublicAuth =
      pathname.startsWith("/api/auth/") &&
      (pathname === "/api/auth/register" ||
        pathname === "/api/auth/forgot-password" ||
        pathname === "/api/auth/reset-password" ||
        pathname.startsWith("/api/auth/"));

    const isNextAuth = pathname.startsWith("/api/auth/");
    if (!isNextAuth && !token?.id && pathname !== "/api/contact") {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Please sign in to continue." } },
        { status: 401 }
      );
    }
    void isPublicAuth;
    void PUBLIC_API_GET;
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
