import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { enforceMutationGuards } from "@/server/http/guards";
import { getClientIp, fingerprintIp } from "@/server/http/clientIp";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{12,}$/;

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_auth_register",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

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
        { success: false, error: { code: "AGE_RESTRICTION", message: "You must attest to being 18 years of age or older to register." } },
        { status: 400 }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { success: false, error: { code: "CONSENT_REQUIRED", message: "You must accept the Terms of Service and Privacy Policy." } },
        { status: 400 }
      );
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WEAK_PASSWORD",
            message: "Password must be at least 12 characters long and contain both letters and numbers.",
          },
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes("placeholder")) {
      return NextResponse.json(
        { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Registration service unavailable." } },
        { status: 503 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        department: location ? location.trim() : null,
      },
    });

    if (authError) {
      if (authError.message?.includes("already been registered")) {
        // Return uniform response for anti-enumeration or generic error
        return NextResponse.json(
          { success: false, error: { code: "USER_EXISTS", message: "An account with this email address already exists." } },
          { status: 400 }
        );
      }
      console.error("[REGISTER] Supabase Auth creation failed:", authError.message);
      return NextResponse.json(
        { success: false, error: { code: "REGISTRATION_FAILED", message: authError.message } },
        { status: 400 }
      );
    }

    const authUserId = authData.user.id;
    const clientIp = getClientIp(req);
    const ipHash = fingerprintIp(clientIp, process.env.NEXTAUTH_SECRET || "consent_hash");

    // Upsert Prisma User record and record DPDP consent
    const now = new Date();
    const dbUser = await prisma.user.upsert({
      where: { email: cleanEmail },
      create: {
        id: authUserId,
        authUserId: authUserId,
        email: cleanEmail,
        name: cleanName,
        fullName: cleanName,
        department: location ? location.trim() : null,
        role: "USER",
        ageAttested18: true,
        termsAcceptedAt: now,
        termsVersion: "2026-v1",
        privacyAcceptedAt: now,
        privacyVersion: "2026-v1",
      },
      update: {
        authUserId: authUserId,
        name: cleanName,
        fullName: cleanName,
        ageAttested18: true,
        termsAcceptedAt: now,
        termsVersion: "2026-v1",
        privacyAcceptedAt: now,
        privacyVersion: "2026-v1",
      },
    });

    // Record DPDP explicit consent records
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

    return NextResponse.json({
      success: true,
      message: "Account registered successfully.",
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
    });
  } catch (error) {
    console.error("[REGISTER] Unhandled server error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Registration failed due to a server error." } },
      { status: 500 }
    );
  }
}
