import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { sessionCookieName } from "@/server/config/authCookies";
import { getClientIp, fingerprintIp } from "@/server/http/clientIp";
import { rateLimit, rateLimitHeaders } from "@/server/http/rateLimit";
import { safeInternalPath } from "@/lib/safeRedirect";

const ADMIN_PREFIXES = ["/admin", "/api/v2/admin"];
const AUTH_REQUIRED_PAGES = ["/dashboard", "/profile", "/host/apply", "/create"];

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
  const secretOk =
    typeof secret === "string" &&
    secret.length >= 32 &&
    !secret.toLowerCase().includes("dev_secret") &&
    !secret.toLowerCase().includes("change-me") &&
    !secret.toLowerCase().includes("fallback");
  if (!secretOk) {
    // Fail closed: never skip page or API auth when secret is missing/weak.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: "Authentication is not configured" } },
        { status: 503 }
      );
    }
    return new NextResponse("Service unavailable", { status: 503 });
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
      url.searchParams.set("redirectTo", safeInternalPath(pathname, "/admin"));
      return NextResponse.redirect(url);
    }
  }

  if (AUTH_REQUIRED_PAGES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (!token?.id) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", safeInternalPath(pathname, "/dashboard"));
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/api/") && request.method !== "GET" && request.method !== "HEAD") {
    const isAuthApi = pathname.startsWith("/api/auth/");
    const isPublicMutation = isAuthApi || pathname === "/api/contact";
    if (!isPublicMutation && !token?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Please sign in to continue." } },
        { status: 401 }
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
