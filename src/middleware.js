import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getClientIp, fingerprintIp } from "@/server/http/clientIp";
import { rateLimitAsync, rateLimitHeaders } from "@/server/http/rateLimit";
import { safeInternalPath } from "@/lib/safeRedirect";

const ADMIN_PREFIXES = ["/admin", "/api/v2/admin"];
const AUTH_REQUIRED_PAGES = ["/dashboard", "/profile", "/settings", "/host/apply", "/create", "/host/scanner"];

function isAdminPath(pathname) {
  return ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function secretOk(secret) {
  return (
    typeof secret === "string" &&
    secret.length >= 32 &&
    !secret.toLowerCase().includes("dev_secret") &&
    !secret.toLowerCase().includes("change-me") &&
    !secret.toLowerCase().includes("fallback")
  );
}

function serviceUnavailable(pathname) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Authentication is not configured" } },
      { status: 503 }
    );
  }
  return new NextResponse("Service unavailable", { status: 503 });
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
  if (!secretOk(secret)) {
    return serviceUnavailable(pathname);
  }

  const ipKey = fingerprintIp(getClientIp(request), secret);

  if (pathname.startsWith("/api/auth") && request.method === "POST") {
    // Prefer shared Redis when configured (multi-instance). Falls back to memory.
    const rl = await rateLimitAsync(`mw_auth:${ipKey}`, 20, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anonParts = String(supabaseKey || "").split(".");
  const anonLooksValid =
    (anonParts.length === 3 && String(supabaseKey).startsWith("eyJ")) ||
    String(supabaseKey || "").startsWith("sb_publishable_");
  const supabaseBroken =
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes("placeholder") ||
    supabaseUrl.includes("uncooked-dev-project.supabase.co") ||
    !anonLooksValid;

  if (supabaseBroken) {
    // Auth APIs + gated pages fail closed when Supabase Auth env is invalid.
    if (
      pathname.startsWith("/api/auth") ||
      isAdminPath(pathname) ||
      AUTH_REQUIRED_PAGES.some((r) => pathname === r || pathname.startsWith(`${r}/`))
    ) {
      return serviceUnavailable(pathname);
    }
    response.headers.set("x-request-id", crypto.randomUUID());
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const nextResponse = NextResponse.next({ request });
        response.headers.forEach((val, key) => nextResponse.headers.set(key, val));
        response = nextResponse;
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let user = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data?.user || null;
  } catch (err) {
    console.warn(`[AUTH_MW] getUser error on ${pathname}`);
  }

  const status = String(user?.app_metadata?.account_status || "").toUpperCase();
  const lockedUntilRaw = user?.app_metadata?.locked_until;
  const lockedUntilMs = lockedUntilRaw ? Date.parse(String(lockedUntilRaw)) : NaN;
  // Temporary locks must expire: LOCKED without a future locked_until is treated as active lock;
  // LOCKED with an expired locked_until is ignored at the Edge (Node heal clears the claim).
  const lockStillActive =
    status === "LOCKED" && (!Number.isFinite(lockedUntilMs) || lockedUntilMs > Date.now());
  const isBlocked = lockStillActive || status === "DISABLED" || status === "DELETED";
  if (user && isBlocked) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "ACCOUNT_BLOCKED", message: "Account has been suspended or disabled." } },
        { status: 403 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "ACCOUNT_BLOCKED");
    return NextResponse.redirect(url);
  }

  // Edge cannot use Prisma. app_metadata.role is a coarse gate only.
  // Fine-grained authz still happens in Node via requireSuperAdmin() + DB role.
  const edgeAdmin = user?.app_metadata?.role === "SUPER_ADMIN";

  if (isAdminPath(pathname)) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHENTICATED", message: "Please sign in to continue." } },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", safeInternalPath(pathname, "/admin"));
      return NextResponse.redirect(url);
    }

    // Admin pages require synced app_metadata.role. APIs fall through to DB checks.
    if (!edgeAdmin && !pathname.startsWith("/api/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (AUTH_REQUIRED_PAGES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", safeInternalPath(pathname, "/dashboard"));
      return NextResponse.redirect(url);
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
