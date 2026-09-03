import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safeRedirect";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || searchParams.get("redirectTo") || "/dashboard";

  const safeNext = safeInternalPath(next, "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      let redirectBase;
      if (isLocalEnv) {
        redirectBase = origin;
      } else if (forwardedHost) {
        redirectBase = `https://${forwardedHost}`;
      } else {
        redirectBase = origin;
      }

      return NextResponse.redirect(`${redirectBase}${safeNext}`);
    }

    console.error("[OAUTH_CALLBACK] Exchange code for session error:", error?.message || "No session returned");
  } else {
    console.warn("[OAUTH_CALLBACK] No code parameter provided in callback request");
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
}
