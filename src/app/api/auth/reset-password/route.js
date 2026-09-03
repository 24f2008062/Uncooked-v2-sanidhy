import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson } from "@/server/http/envelope";
import { enforceMutationGuards } from "@/server/http/guards";
import { validatePasswordPolicy } from "@/server/utils/passwordUtils";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_reset_password",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;

    const { email, token, newPassword, password } = parsed.body;
    const passToUse = newPassword || password;

    const cleanEmail = String(email || "").toLowerCase().trim();
    if (!cleanEmail || !token || !passToUse) {
      return jsonError("Email, token, and new password are required", 400);
    }

    const policyError = validatePasswordPolicy(passToUse);
    if (policyError) {
      return jsonError(policyError, 400);
    }

    // Step 1: Atomic Reset Token Acquisition (Concurrency & Replay Protection)
    // Deleting matching token atomically ensures ONLY ONE request can claim ownership.
    const claimedToken = await prisma.verificationToken.deleteMany({
      where: {
        identifier: cleanEmail,
        token: token,
        purpose: "PASSWORD_RESET",
        expires: { gt: new Date() },
      },
    });

    if (claimedToken.count === 0) {
      console.error("[PASSWORD_RESET_FAILED]", {
        reason: "RESET_TOKEN_INVALID_OR_CONSUMED",
        email: cleanEmail,
        timestamp: new Date().toISOString(),
      });
      return jsonError("Invalid, expired, or already used password reset token.", 400);
    }

    // Step 2: Resolve Application User
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      console.error("[PASSWORD_RESET_FAILED]", {
        reason: "USER_NOT_FOUND",
        email: cleanEmail,
        timestamp: new Date().toISOString(),
      });
      return jsonError("User account not found", 404);
    }

    // Track initial link state before any mutations
    const wasAlreadyLinked = Boolean(user.authUserId);

    // Step 3: Resolve Canonical Supabase Auth Identity
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes("placeholder") || supabaseServiceKey.includes("placeholder")) {
      console.error("[PASSWORD_RESET_FAILED]", {
        reason: "SERVICE_UNAVAILABLE",
        message: "Missing or placeholder Supabase credentials",
        timestamp: new Date().toISOString(),
      });
      return jsonError("Password reset service is currently unavailable.", 503);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    let targetAuthUserId = null;

    if (user.authUserId) {
      // User has linked authUserId; verify Supabase Auth record exists
      const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(user.authUserId);

      if (authUserError || !authUserData?.user) {
        console.error("[PASSWORD_RESET_FAILED]", {
          reason: "AUTH_IDENTITY_NOT_FOUND",
          applicationUserId: user.id,
          authUserId: user.authUserId,
          supabaseCode: authUserError?.code,
          timestamp: new Date().toISOString(),
        });
        return jsonError("Password reset could not be completed for this account. Please contact support.", 500);
      }

      if (authUserData.user.email && authUserData.user.email.toLowerCase() !== cleanEmail) {
        console.error("[PASSWORD_RESET_FAILED]", {
          reason: "AUTH_IDENTITY_CONFLICT",
          applicationUserId: user.id,
          authUserId: user.authUserId,
          authEmail: authUserData.user.email,
          timestamp: new Date().toISOString(),
        });
        return jsonError("Password reset could not be completed. Identity conflict detected.", 500);
      }

      targetAuthUserId = user.authUserId;
    } else {
      // Unlinked user: query auth.users by email to resolve candidate identities
      let authRecords = [];
      try {
        authRecords = await prisma.$queryRaw`SELECT id, email_confirmed_at FROM auth.users WHERE LOWER(email) = ${cleanEmail}`;
      } catch (rawErr) {
        console.error("[PASSWORD_RESET_FAILED]", {
          reason: "AUTH_QUERY_FAILED",
          error: rawErr.message,
          timestamp: new Date().toISOString(),
        });
      }

      if (!authRecords || authRecords.length === 0) {
        console.error("[PASSWORD_RESET_FAILED]", {
          reason: "AUTH_IDENTITY_NOT_PROVISIONED",
          applicationUserId: user.id,
          email: cleanEmail,
          timestamp: new Date().toISOString(),
        });
        return jsonError("Password reset could not be completed for this account. Please request a new reset link or contact support.", 500);
      }

      if (authRecords.length > 1) {
        console.error("[PASSWORD_RESET_FAILED]", {
          reason: "AUTH_IDENTITY_AMBIGUOUS",
          applicationUserId: user.id,
          email: cleanEmail,
          matchCount: authRecords.length,
          timestamp: new Date().toISOString(),
        });
        return jsonError("Password reset could not be completed. Ambiguous identity detected.", 500);
      }

      const candidate = authRecords[0];

      // Require Verified Email for Auto-Linking
      if (!candidate.email_confirmed_at) {
        console.error("[PASSWORD_RESET_FAILED]", {
          reason: "AUTH_IDENTITY_UNVERIFIED",
          applicationUserId: user.id,
          email: cleanEmail,
          candidateAuthId: candidate.id,
          timestamp: new Date().toISOString(),
        });
        return jsonError("Password reset could not be completed. Auth email is not verified.", 500);
      }

      // Check if candidate identity is already linked to another application user
      const conflictingUser = await prisma.user.findFirst({
        where: { authUserId: candidate.id },
      });

      if (conflictingUser && conflictingUser.id !== user.id) {
        console.error("[PASSWORD_RESET_FAILED]", {
          reason: "AUTH_IDENTITY_CONFLICT",
          applicationUserId: user.id,
          conflictingUserId: conflictingUser.id,
          candidateAuthId: candidate.id,
          timestamp: new Date().toISOString(),
        });
        return jsonError("Password reset could not be completed. Identity conflict detected.", 500);
      }

      targetAuthUserId = candidate.id;
    }

    // Step 4: Perform Canonical Supabase Password Update (MUST succeed or fail closed)
    let updateResult;
    try {
      updateResult = await supabaseAdmin.auth.admin.updateUserById(
        targetAuthUserId,
        { password: passToUse }
      );
    } catch (netErr) {
      console.error("[PASSWORD_RESET_FAILED]", {
        reason: "AUTH_UPDATE_OUTCOME_UNKNOWN",
        applicationUserId: user.id,
        authUserId: targetAuthUserId,
        error: netErr.message,
        timestamp: new Date().toISOString(),
      });
      return jsonError("Password reset outcome unknown due to service timeout. Please try logging in with your new password.", 504);
    }

    const { data: updateData, error: updateError } = updateResult;

    if (updateError || !updateData?.user?.id) {
      console.error("[PASSWORD_RESET_FAILED]", {
        reason: "AUTH_PROVIDER_UPDATE_FAILED",
        applicationUserId: user.id,
        authUserId: targetAuthUserId,
        supabaseCode: updateError?.code,
        supabaseMessage: updateError?.message,
        timestamp: new Date().toISOString(),
      });

      // Single-attempt token policy: token remains consumed to prioritize concurrency/replay safety.
      return jsonError("Password reset could not be completed. Please request a new reset link.", 500);
    }

    // Step 5: Reconcile Local State & Clear Legacy passwordHash for Migrated User
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          authUserId: targetAuthUserId,
          passwordHash: null, // Clear legacy password hash upon migration/reset
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    } catch (prismaErr) {
      if (wasAlreadyLinked) {
        console.error("[PASSWORD_RESET_FAILED]", {
          reason: "AUTH_UPDATED_LOCAL_CLEANUP_FAILED",
          applicationUserId: user.id,
          authUserId: targetAuthUserId,
          error: prismaErr.message,
          timestamp: new Date().toISOString(),
        });
        // Existing identity mapping intact; Supabase authentication functional
        return jsonOk({
          success: true,
          message: "Your password has been reset successfully. You can now log in.",
        });
      } else {
        console.error("[PASSWORD_RESET_FAILED]", {
          reason: "AUTH_UPDATED_IDENTITY_LINK_FAILED",
          applicationUserId: user.id,
          authUserId: targetAuthUserId,
          error: prismaErr.message,
          timestamp: new Date().toISOString(),
        });
        // Unlinked legacy account: Supabase updated, but local identity link failed
        return jsonError("Your password may have been updated, but we couldn't complete account recovery. Please try signing in with your new password. If access is not restored, contact support.", 500);
      }
    }

    return jsonOk({
      success: true,
      message: "Your password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("[PASSWORD_RESET_FAILED]", {
      reason: "UNHANDLED_EXCEPTION",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return jsonError("Failed to reset password", 500);
  }
}



