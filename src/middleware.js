import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getClientIp, fingerprintIp } from "@/server/http/clientIp";
import { rateLimit, rateLimitHeaders } from "@/server/http/rateLimit";
import { safeInternalPath } from "@/lib/safeRedirect";

const ADMIN_PREFIXES = ["/admin", "/api/v2/admin"];
const AUTH_REQUIRED_PAGES = ["/dashboard", "/profile", "/host/apply", "/create", "/host/scanner"];

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

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          const nextResponse = NextResponse.next({
            request,
          });
          // Preserve any existing response headers
          response.headers.forEach((val, key) => nextResponse.headers.set(key, val));
          response = nextResponse;
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  let getUserError = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
    try {
      const res = await supabase.auth.getUser();
      user = res.data?.user || null;
      getUserError = res.error || null;
    } catch (err) {
      console.warn(`[AUTH_MW] getUser error on ${pathname}:`, err.message);
    }
  }

  if (getUserError) {
    console.warn(`[AUTH_MW] getUser warning on ${pathname}:`, getUserError.message);
  }

  if (isAdminPath(pathname)) {
    if (!user || user.user_metadata?.role !== "SUPER_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Administrator access required." } },
          { status: user ? 403 : 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", safeInternalPath(pathname, "/admin"));
      const redirectResponse = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }
  }

  if (AUTH_REQUIRED_PAGES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", safeInternalPath(pathname, "/dashboard"));
      const redirectResponse = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }
  }

  if (pathname.startsWith("/api/") && request.method !== "GET" && request.method !== "HEAD") {
    const isAuthApi = pathname.startsWith("/api/auth/");
    const isPublicMutation = isAuthApi || pathname === "/api/contact";
    if (!isPublicMutation && !user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Please sign in to continue." } },
        { status: 401 }
      );
    }
  }
  
  response.headers.set("x-request-id", crypto.randomUUID());

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
