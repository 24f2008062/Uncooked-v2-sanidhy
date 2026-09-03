import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/server/utils/passwordUtils";
import { createClient } from "@supabase/supabase-js";
import { enforceMutationGuards } from "@/server/http/guards";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_auth_migrate_login",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes("placeholder") || supabaseServiceKey.includes("placeholder")) {
      console.error("[SECURITY] Missing or placeholder Supabase credentials for migration service");
      return NextResponse.json(
        { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Authentication migration service currently unavailable." } },
        { status: 503 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials provided." } }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch user from Prisma
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials provided." } }, { status: 401 });
    }

    // 2. State A: Hard Stop for Already-Migrated Accounts
    if (user.authUserId !== null) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_MIGRATED", message: "Account already migrated. Please sign in normally." } },
        { status: 400 }
      );
    }

    // Must have a legacy password hash to proceed
    if (!user.passwordHash) {
      return NextResponse.json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials provided." } }, { status: 401 });
    }

    // 3. Verify legacy password BEFORE any identity or password mutation
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials provided." } }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Determine / Recover Supabase Identity Safely
    let authUserId = null;

    // Check if identity already exists in auth.users
    const authRecords = await prisma.$queryRaw`SELECT id FROM auth.users WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;

    if (authRecords && authRecords.length > 0) {
      const existingAuthId = authRecords[0].id;

      // Identity Conflict Check: Verify existingAuthId is not already linked to another application user
      const conflictingUser = await prisma.user.findFirst({
        where: { authUserId: existingAuthId },
      });

      if (conflictingUser && conflictingUser.id !== user.id) {
        console.error("[Migrate] AUTH_IDENTITY_CONFLICT detected during migration");
        return NextResponse.json(
          { success: false, error: { code: "AUTH_IDENTITY_CONFLICT", message: "Identity conflict detected during migration." } },
          { status: 409 }
        );
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingAuthId, {
        password: password,
        email_confirm: true,
        user_metadata: {
          name: user.name || user.fullName || "User",
          department: user.department,
        },
      });

      if (updateError) {
        console.error("[Migrate] Failed to update password for existing auth record:", updateError.message);
        return NextResponse.json({ success: false, error: { code: "SUPABASE_UPDATE_FAILED", message: "Failed to update authentication credentials." } }, { status: 500 });
      }

      authUserId = existingAuthId;
    } else {
      // Create new Supabase identity
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: user.name || user.fullName || "User",
          department: user.department,
        },
      });

      if (createError) {
        if (createError.message && createError.message.includes("already been registered")) {
          const raceRecords = await prisma.$queryRaw`SELECT id FROM auth.users WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;
          if (raceRecords && raceRecords.length > 0) {
            authUserId = raceRecords[0].id;
          }
        }
        
        if (!authUserId) {
          console.error("[Migrate] Failed to create Supabase Auth user:", createError.message);
          return NextResponse.json({ success: false, error: { code: "SUPABASE_CREATE_FAILED", message: "Failed to create user in Auth." } }, { status: 500 });
        }
      } else if (newUser?.user) {
        authUserId = newUser.user.id;
      }
    }

    // 5. Conflict-Safe Atomic Identity Linking & Password Hash Clearing
    if (authUserId) {
      const updateResult = await prisma.user.updateMany({
        where: {
          id: user.id,
          authUserId: null,
        },
        data: {
          authUserId: authUserId,
          passwordHash: null,
        },
      });

      if (updateResult.count === 0) {
        console.warn("[Migrate] Concurrent migration detected or authUserId already set for user ID:", user.id);
      }
    }

    return NextResponse.json({ success: true, message: "Migration successful." });
  } catch (err) {
    console.error("[Migrate] Unhandled error during migration:", err.message);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, { status: 500 });
  }
}

