import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { safeInternalPath } from "@/lib/safeRedirect";
import { getAppBaseUrl } from "@/lib/appUrl";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || searchParams.get("redirectTo") || "/dashboard";
  const safeNext = safeInternalPath(next, "/dashboard");

  let redirectBase = origin;
  try {
    // Prefer configured public URL; never trust x-forwarded-host.
    redirectBase = getAppBaseUrl();
  } catch {
    if (process.env.NODE_ENV === "development") {
      redirectBase = origin;
    } else {
      return NextResponse.redirect(`${origin}/login?error=app_url_misconfigured`);
    }
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session?.user) {
      const authUser = data.session.user;
      const cleanEmail = authUser.email ? authUser.email.toLowerCase().trim() : null;
      const name =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.user_metadata?.user_name ||
        (cleanEmail ? cleanEmail.split("@")[0] : "User");

      if (cleanEmail) {
        try {
          const existing = await prisma.user.findFirst({
            where: {
              OR: [{ authUserId: authUser.id }, { email: cleanEmail }],
            },
          });

          if (!existing) {
            await prisma.user.create({
              data: {
                id: authUser.id,
                authUserId: authUser.id,
                email: cleanEmail,
                name,
                fullName: name,
                role: "USER",
                ageAttested18: true,
                termsAcceptedAt: new Date(),
                termsVersion: "2026-v1",
                privacyAcceptedAt: new Date(),
                privacyVersion: "2026-v1",
              },
            });
          } else if (!existing.authUserId) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { authUserId: authUser.id },
            });
          }
        } catch (dbErr) {
          console.error("[OAUTH_CALLBACK] Error syncing user profile:", dbErr.message);
        }
      }

      return NextResponse.redirect(`${redirectBase}${safeNext}`);
    }

    console.error("[OAUTH_CALLBACK] Exchange code for session error:", error?.message || "No session returned");
  } else {
    console.warn("[OAUTH_CALLBACK] No code parameter provided in callback request");
  }

  return NextResponse.redirect(`${redirectBase}/login?error=oauth_callback_failed`);
}
