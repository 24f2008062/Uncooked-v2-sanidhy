import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { enforceMutationGuards } from "@/server/http/guards";
import { getClientIp, fingerprintIp } from "@/server/http/clientIp";
import { validatePasswordPolicy } from "@/server/utils/passwordUtils";
import { requireAuthSecret } from "@/server/security/secrets";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_auth_register",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const envIssues = getSupabasePublicConfig().issues;
    if (envIssues.length) {
      console.error("[REGISTER] supabase env invalid:", envIssues.join("; "));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_MISCONFIGURED",
            message: "Registration is temporarily unavailable. Authentication is misconfigured.",
          },
        },
        { status: 503 }
      );
    }

    let authSecret;
    try {
      authSecret = requireAuthSecret();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Registration service unavailable." } },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { name, email, location, password, ageAttested18, acceptTerms } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_FIELDS", message: "Name, email, and password are required." } },
        { status: 400 }
      );
    }

    if (!ageAttested18) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AGE_RESTRICTION",
            message: "You must attest to being 18 years of age or older to register.",
          },
        },
        { status: 400 }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONSENT_REQUIRED",
            message: "You must accept the Terms of Service and Privacy Policy.",
          },
        },
        { status: 400 }
      );
    }

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: { code: "WEAK_PASSWORD", message: passwordError } },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = String(name).trim();
    if (!cleanName || cleanName.length > 120) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_NAME", message: "Please provide a valid name." } },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
      return NextResponse.json(
        { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Registration service unavailable." } },
        { status: 503 }
      );
    }

    // Public signup via anon client — email stays unconfirmed until the user verifies.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          department: location ? String(location).trim() : null,
          ageAttested18: true,
          acceptTerms: true,
        },
      },
    });

    if (authError) {
      console.error("[REGISTER] Supabase signUp failed");
      // Anti-enumeration: same message for existing accounts when Supabase reveals them.
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REGISTRATION_FAILED",
            message: "Unable to complete registration. Try a different email or sign in.",
          },
        },
        { status: 400 }
      );
    }

    const authUserId = authData?.user?.id || null;
    const clientIp = getClientIp(req);
    const ipHash = fingerprintIp(clientIp, authSecret);
    const now = new Date();

    // Trigger may also insert the User row; upsert keeps consent fields authoritative.
    if (authUserId) {
      const dbUser = await prisma.user.upsert({
        where: { email: cleanEmail },
        create: {
          id: authUserId,
          authUserId,
          email: cleanEmail,
          name: cleanName,
          fullName: cleanName,
          department: location ? String(location).trim() : null,
          role: "USER",
          ageAttested18: true,
          termsAcceptedAt: now,
          termsVersion: "2026-v1",
          privacyAcceptedAt: now,
          privacyVersion: "2026-v1",
        },
        update: {
          authUserId,
          name: cleanName,
          fullName: cleanName,
          ageAttested18: true,
          termsAcceptedAt: now,
          termsVersion: "2026-v1",
          privacyAcceptedAt: now,
          privacyVersion: "2026-v1",
        },
      });

      await prisma.consentRecord.createMany({
        data: [
          {
            userId: dbUser.id,
            kind: "TERMS_AND_PRIVACY",
            version: "2026-v1",
            acceptedAt: now,
            ipHash,
          },
          {
            userId: dbUser.id,
            kind: "AGE_ATTESTATION_18",
            version: "2026-v1",
            acceptedAt: now,
            ipHash,
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: true,
      message: "Account created. Please verify your email before signing in.",
    });
  } catch (error) {
    console.error("[REGISTER] Unhandled server error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Registration failed due to a server error." } },
      { status: 500 }
    );
  }
}
