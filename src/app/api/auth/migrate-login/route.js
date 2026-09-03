import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/server/utils/passwordUtils";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required", code: "MISSING_CREDENTIALS" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch user from Prisma
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      console.log("[Migrate] Application user not found for", cleanEmail);
      return NextResponse.json({ error: "Invalid credentials", code: "LEGACY_USER_NOT_FOUND" }, { status: 401 });
    }

    // 2. State A: Hard Stop for Already-Migrated Accounts (Section 1 & 2)
    if (user.authUserId !== null) {
      console.log("[Migrate] Account already migrated for", cleanEmail, "- authUserId:", user.authUserId);
      return NextResponse.json(
        { error: "Account already migrated. Please sign in normally.", code: "ALREADY_MIGRATED" },
        { status: 400 }
      );
    }

    // Must have a legacy password hash to proceed
    if (!user.passwordHash) {
      console.log("[Migrate] Unmigrated user has no legacy passwordHash for", cleanEmail);
      return NextResponse.json({ error: "Invalid credentials", code: "NO_LEGACY_HASH" }, { status: 401 });
    }

    // 3. Verify legacy password BEFORE any identity or password mutation
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      console.log("[Migrate] Legacy password verification failed for", cleanEmail);
      return NextResponse.json({ error: "Invalid credentials", code: "INVALID_LEGACY_PASSWORD" }, { status: 401 });
    }

    console.log("[Migrate] Legacy password verified successfully for unmigrated user:", cleanEmail);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // 4. Determine / Recover Supabase Identity Safely
    let authUserId = null;

    // Check if identity already exists in auth.users (e.g. Partial Migration Recovery)
    const authRecords = await prisma.$queryRaw`SELECT id FROM auth.users WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;

    if (authRecords && authRecords.length > 0) {
      const existingAuthId = authRecords[0].id;

      // Identity Conflict Check (Section 4): Verify existingAuthId is not already linked to another application user
      const conflictingUser = await prisma.user.findFirst({
        where: { authUserId: existingAuthId },
      });

      if (conflictingUser && conflictingUser.id !== user.id) {
        console.error("[Migrate] AUTH_IDENTITY_CONFLICT: auth.users ID", existingAuthId, "already belongs to User.id", conflictingUser.id);
        return NextResponse.json(
          { error: "Identity conflict detected during migration", code: "AUTH_IDENTITY_CONFLICT" },
          { status: 409 }
        );
      }

      console.log("[Migrate] PARTIAL_MIGRATION_RECOVERED: Updating password for existing auth record:", existingAuthId);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingAuthId, {
        password: password,
        email_confirm: true,
      });

      if (updateError) {
        console.error("[Migrate] Failed to update password for existing auth record:", updateError);
        return NextResponse.json({ error: "Failed to update authentication password", code: "SUPABASE_UPDATE_FAILED" }, { status: 500 });
      }

      authUserId = existingAuthId;
    } else {
      // Create new Supabase identity
      console.log("[Migrate] Creating new Supabase Auth identity...");
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: { name: user.name || user.fullName || "User", department: user.department }
      });

      if (createError) {
        // Recover from concurrent creation race if user was registered in split second
        if (createError.message && createError.message.includes("already been registered")) {
          console.warn("[Migrate] Concurrent creation race detected. Recovering auth user by email...");
          const raceRecords = await prisma.$queryRaw`SELECT id FROM auth.users WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;
          if (raceRecords && raceRecords.length > 0) {
            authUserId = raceRecords[0].id;
          }
        }
        
        if (!authUserId) {
          console.error("[Migrate] Failed to create Supabase Auth user:", createError);
          return NextResponse.json({ error: "Failed to create user in Auth", code: "SUPABASE_CREATE_FAILED" }, { status: 500 });
        }
      } else if (newUser?.user) {
        authUserId = newUser.user.id;
      }
    }

    // 5. Conflict-Safe Atomic Identity Linking & Password Hash Clearing (Section 6 & 7)
    if (authUserId) {
      console.log("[Migrate] Atomically linking authUserId", authUserId, "to User.id", user.id);
      const updateResult = await prisma.user.updateMany({
        where: {
          id: user.id,
          authUserId: null,
        },
        data: {
          authUserId: authUserId,
          passwordHash: null, // Clear passwordHash atomically with linkage!
        },
      });

      if (updateResult.count === 0) {
        console.warn("[Migrate] Concurrent migration detected or authUserId already set for user:", user.id);
      }
    }

    console.log("[Migrate] JIT migration completed successfully for", cleanEmail);
    return NextResponse.json({ success: true, code: "MIGRATION_SUCCESSFUL" });
  } catch (err) {
    console.error("[Migrate] Unhandled error during migration:", err);
    return NextResponse.json({ error: "Internal server error", code: "DATABASE_ERROR" }, { status: 500 });
  }
}
