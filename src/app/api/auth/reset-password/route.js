import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson } from "@/server/http/envelope";
import { enforceMutationGuards } from "@/server/http/guards";
import { validatePasswordPolicy } from "@/server/utils/passwordUtils";
import { getSupabaseAdmin, syncAuthAppMetadata } from "@/lib/supabase/admin";

function hashIdentifier(val) {
  return createHash("sha256").update(String(val || "")).digest("hex").slice(0, 12);
}

function logAuthEvent(event, details = {}) {
  console.log(`[AUTH_EVENT] ${event}`, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

function logAuthError(event, details = {}) {
  console.error(`[AUTH_ERROR] ${event}`, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

/**
 * Paginates through Supabase users to locate candidates matching cleanEmail.
 * Strictly uses supported GoTrue Admin API without raw SQL access to auth.users.
 */
async function findSupabaseUserByEmail(supabaseAdmin, cleanEmail) {
  let page = 1;
  const perPage = 100;
  const matches = [];

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users) {
      return { users: [], error };
    }

    for (const u of data.users) {
      if (u.email && u.email.toLowerCase().trim() === cleanEmail) {
        matches.push(u);
      }
    }

    if (matches.length > 0 || !data.nextPage || data.users.length < perPage) {
      break;
    }
    page = data.nextPage;
  }

  return { users: matches, error: null };
}

/**
 * Safely releases the atomic claim on a token so the user can retry on recoverable errors.
 */
async function releaseTokenClaim(cleanEmail, token) {
  try {
    await prisma.verificationToken.updateMany({
      where: {
        identifier: cleanEmail,
        token: token,
        purpose: "PASSWORD_RESET",
        consumedAt: null,
      },
      data: {
        claimedAt: null,
      },
    });
  } catch (err) {
    console.error("[PASSWORD_RESET] Failed to release token claim:", err.message);
  }
}

/**
 * Finalizes consumption of a reset token upon verified password update success.
 */
async function consumeTokenRecord(cleanEmail, token) {
  try {
    await prisma.verificationToken.updateMany({
      where: {
        identifier: cleanEmail,
        token: token,
        purpose: "PASSWORD_RESET",
      },
      data: {
        consumedAt: new Date(),
        claimedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[PASSWORD_RESET] Failed to mark token consumed:", err.message);
  }
}

export async function POST(req) {
  let cleanEmail = "";
  let tokenToUse = "";
  let emailHash = "";

  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_reset_password",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;

    const { email, token, newPassword, password } = parsed.body || {};
    const passToUse = newPassword || password;

    cleanEmail = String(email || "").toLowerCase().trim();
    tokenToUse = String(token || "").trim();
    emailHash = hashIdentifier(cleanEmail);

    if (!cleanEmail || !tokenToUse || !passToUse) {
      return jsonError("Email, token, and new password are required", 400, "INVALID_REQUEST");
    }

    // Validate application-level password policy before claiming the token
    const policyError = validatePasswordPolicy(passToUse);
    if (policyError) {
      return jsonError(policyError, 400, "WEAK_PASSWORD");
    }

    // Step 1: Atomic Claim (ACTIVE -> CLAIMED)
    // Only unclaimed, unconsumed, unexpired tokens can be claimed.
    const claimResult = await prisma.verificationToken.updateMany({
      where: {
        identifier: cleanEmail,
        token: tokenToUse,
        purpose: "PASSWORD_RESET",
        expires: { gt: new Date() },
        claimedAt: null,
        consumedAt: null,
      },
      data: {
        claimedAt: new Date(),
      },
    });

    if (claimResult.count === 0) {
      // Query token to provide precise, non-leaking status code
      const existingToken = await prisma.verificationToken.findFirst({
        where: { identifier: cleanEmail, token: tokenToUse, purpose: "PASSWORD_RESET" },
      });

      if (!existingToken) {
        logAuthError("PASSWORD_RESET_TOKEN_REJECTED", { reason: "INVALID_RESET_TOKEN", emailHash });
        return jsonError("Invalid password reset token.", 400, "INVALID_RESET_TOKEN");
      }
      if (existingToken.expires <= new Date()) {
        logAuthError("PASSWORD_RESET_TOKEN_REJECTED", { reason: "RESET_TOKEN_EXPIRED", emailHash });
        return jsonError("Password reset token has expired. Please request a new link.", 400, "RESET_TOKEN_EXPIRED");
      }
      if (existingToken.consumedAt !== null) {
        logAuthError("PASSWORD_RESET_TOKEN_REJECTED", { reason: "RESET_TOKEN_ALREADY_USED", emailHash });
        return jsonError("This password reset link has already been used.", 400, "RESET_TOKEN_ALREADY_USED");
      }
      if (existingToken.claimedAt !== null) {
        logAuthError("PASSWORD_RESET_TOKEN_REJECTED", { reason: "RESET_TOKEN_IN_PROGRESS", emailHash });
        return jsonError("A password reset request is already in progress. Please try again shortly.", 409, "RESET_TOKEN_IN_PROGRESS");
      }

      return jsonError("Invalid or already used password reset token.", 400, "INVALID_RESET_TOKEN");
    }

    logAuthEvent("PASSWORD_RESET_TOKEN_CLAIMED", { emailHash });

    // Step 2: Resolve Application User
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      await releaseTokenClaim(cleanEmail, tokenToUse);
      logAuthError("PASSWORD_RESET_TOKEN_REJECTED", { reason: "USER_NOT_FOUND", emailHash });
      return jsonError("User account not found", 404, "USER_NOT_FOUND");
    }

    // Track initial link state before any mutations
    const wasAlreadyLinked = Boolean(user.authUserId);

    // Step 3: Initialize Supabase Admin Client
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      await releaseTokenClaim(cleanEmail, tokenToUse);
      logAuthError("PASSWORD_RESET_PROVIDER_FAILURE", {
        reason: "SERVICE_UNAVAILABLE",
        message: "Missing or placeholder Supabase credentials",
        emailHash,
      });
      return jsonError("Password reset service is currently unavailable.", 503, "AUTH_PROVIDER_UNAVAILABLE");
    }

    let targetAuthUserId = null;
    let isJitCreated = false;

    // Step 4: Resolve & Provision Identity
    if (user.authUserId) {
      // Primary UUID Lookup (Strict 1:1 mapping)
      const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(user.authUserId);

      if (authUserData?.user) {
        if (authUserData.user.email && authUserData.user.email.toLowerCase().trim() !== cleanEmail) {
          await releaseTokenClaim(cleanEmail, tokenToUse);
          logAuthError("PASSWORD_RESET_IDENTITY_CONFLICT", {
            reason: "AUTH_EMAIL_MISMATCH",
            userId: user.id,
            authUserId: user.authUserId,
            authEmail: authUserData.user.email,
            emailHash,
          });
          return jsonError("Password reset cannot be completed. Identity conflict detected.", 409, "ACCOUNT_IDENTITY_CONFLICT");
        }
        targetAuthUserId = user.authUserId;
      } else {
        // Stale or orphaned authUserId in Prisma that no longer exists in Supabase Auth
        logAuthError("PASSWORD_RESET_ORPHANED_AUTH_ID", {
          reason: "AUTH_IDENTITY_NOT_FOUND_IN_SUPABASE",
          userId: user.id,
          staleAuthUserId: user.authUserId,
          providerErrorCode: authUserError?.code || authUserError?.status,
          emailHash,
        });
        // targetAuthUserId remains null, falling through to email resolution below to self-heal
      }
    }

    if (!targetAuthUserId) {
      // Legacy Unmigrated Account Recovery or Stale Auth ID Self-Healing
      const { users: candidateUsers, error: listError } = await findSupabaseUserByEmail(supabaseAdmin, cleanEmail);

      if (listError) {
        await releaseTokenClaim(cleanEmail, tokenToUse);
        logAuthError("PASSWORD_RESET_PROVIDER_FAILURE", {
          reason: "AUTH_LIST_FAILED",
          userId: user.id,
          emailHash,
          providerErrorCode: listError.message,
        });
        return jsonError("Authentication service temporarily unavailable.", 503, "AUTH_PROVIDER_UNAVAILABLE");
      }

      if (candidateUsers.length === 1) {
        // Case A: Exactly one Supabase user exists for this email
        const candidate = candidateUsers[0];

        // Conflict check: Ensure candidate identity is not already linked to another application user
        const conflictingUser = await prisma.user.findFirst({
          where: { authUserId: candidate.id, id: { not: user.id } },
        });

        if (conflictingUser) {
          await releaseTokenClaim(cleanEmail, tokenToUse);
          logAuthError("PASSWORD_RESET_IDENTITY_CONFLICT", {
            reason: "AUTH_ID_ALREADY_MAPPED_TO_OTHER_USER",
            userId: user.id,
            conflictingUserId: conflictingUser.id,
            candidateAuthId: candidate.id,
            emailHash,
          });
          return jsonError("Password reset cannot be completed. Identity conflict detected.", 409, "ACCOUNT_IDENTITY_CONFLICT");
        }

        targetAuthUserId = candidate.id;
        isJitCreated = false;
        logAuthEvent("PASSWORD_RESET_IDENTITY_LINKED", {
          userId: user.id,
          authUserId: targetAuthUserId,
          emailHash,
        });
      } else if (candidateUsers.length === 0) {
        // Case B: No Supabase identity exists -> JIT provision identity
        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: passToUse,
          email_confirm: true, // Mailbox ownership proved by valid reset token
          user_metadata: {
            name: user.name || user.fullName || "User",
            department: user.department ?? undefined,
            role: user.role || "USER",
          },
          app_metadata: {
            role: String(user.role || "USER").toUpperCase(),
            account_status: "ACTIVE",
          },
        });

        if (createError || !newUserData?.user) {
          const msg = String(createError?.message || "");

          // Check for concurrent creation race condition
          if (msg.includes("already been registered") || createError?.status === 422) {
            const retry = await findSupabaseUserByEmail(supabaseAdmin, cleanEmail);
            if (retry.users.length === 1) {
              targetAuthUserId = retry.users[0].id;
              isJitCreated = false;
            } else {
              await releaseTokenClaim(cleanEmail, tokenToUse);
              return jsonError("Password reset could not be completed. Failed to provision authentication credentials.", 500, "AUTH_PROVISIONING_FAILED");
            }
          } else {
            await releaseTokenClaim(cleanEmail, tokenToUse);
            const isWeak = createError?.code === "weak_password" || /weak|password|character|pwned|length/i.test(msg);
            if (isWeak) {
              logAuthError("PASSWORD_RESET_TOKEN_REJECTED", { reason: "WEAK_PASSWORD", emailHash });
              return jsonError(msg || "Password does not meet required security requirements.", 400, "WEAK_PASSWORD");
            }

            logAuthError("PASSWORD_RESET_PROVIDER_FAILURE", {
              reason: "AUTH_PROVISION_FAILED",
              userId: user.id,
              emailHash,
              providerErrorCode: msg,
            });
            return jsonError("Password reset could not be completed. Failed to provision authentication credentials.", 500, "AUTH_PROVISIONING_FAILED");
          }
        } else {
          targetAuthUserId = newUserData.user.id;
          isJitCreated = true;
          logAuthEvent("PASSWORD_RESET_IDENTITY_PROVISIONED", {
            userId: user.id,
            authUserId: targetAuthUserId,
            emailHash,
          });
        }
      } else {
        // Case C: Ambiguous matches detected
        await releaseTokenClaim(cleanEmail, tokenToUse);
        logAuthError("PASSWORD_RESET_IDENTITY_CONFLICT", {
          reason: "AUTH_IDENTITY_AMBIGUOUS",
          userId: user.id,
          matchCount: candidateUsers.length,
          emailHash,
        });
        return jsonError("Password reset cannot be completed. Ambiguous identity detected.", 409, "ACCOUNT_IDENTITY_CONFLICT");
      }
    }

    // Step 5: Password Update (for accounts where password was not already set during JIT creation)
    if (!isJitCreated) {
      let updateResult;
      try {
        updateResult = await supabaseAdmin.auth.admin.updateUserById(targetAuthUserId, {
          password: passToUse,
          email_confirm: true, // Mailbox ownership validated by reset token
        });
      } catch (netErr) {
        await releaseTokenClaim(cleanEmail, tokenToUse);
        logAuthError("PASSWORD_RESET_PROVIDER_FAILURE", {
          reason: "AUTH_TIMEOUT",
          userId: user.id,
          authUserId: targetAuthUserId,
          emailHash,
          error: netErr.message,
        });
        return jsonError("Authentication service timed out. Please try again.", 503, "AUTH_PROVIDER_UNAVAILABLE");
      }

      const { error: updateError } = updateResult;

      if (updateError) {
        const errorMsg = String(updateError.message || "");
        const isWeak = updateError.code === "weak_password" || /weak|password|character|pwned|length/i.test(errorMsg);

        // Release the claim so the user can immediately retry with the same link
        await releaseTokenClaim(cleanEmail, tokenToUse);

        if (isWeak) {
          logAuthError("PASSWORD_RESET_TOKEN_REJECTED", {
            reason: "WEAK_PASSWORD",
            userId: user.id,
            authUserId: targetAuthUserId,
            emailHash,
            providerErrorCode: updateError.code,
          });
          return jsonError(
            errorMsg || "Password does not meet required security requirements.",
            400,
            "WEAK_PASSWORD"
          );
        }

        logAuthError("PASSWORD_RESET_PROVIDER_FAILURE", {
          reason: "AUTH_PROVIDER_UPDATE_FAILED",
          userId: user.id,
          authUserId: targetAuthUserId,
          providerErrorCode: updateError.code || updateError.message,
          emailHash,
        });
        return jsonError("Password reset could not be completed. Please request a new reset link.", 500, "AUTH_PROVIDER_UPDATE_FAILED");
      }

      logAuthEvent("PASSWORD_RESET_PASSWORD_UPDATED", {
        userId: user.id,
        authUserId: targetAuthUserId,
        emailHash,
      });
    }

    // Step 6: Reconcile Local Prisma State & Clear Legacy passwordHash
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          authUserId: targetAuthUserId,
          passwordHash: null, // Clear legacy scrypt hash upon successful Supabase migration
          failedLoginAttempts: 0,
          lockedUntil: null,
          tokenVersion: { increment: 1 },
        },
      });
    } catch (prismaErr) {
      // Concurrency recovery: If another request concurrently set authUserId
      if (prismaErr.code === "P2002") {
        const current = await prisma.user.findUnique({ where: { id: user.id } });
        if (current?.authUserId === targetAuthUserId) {
          // Idempotent success
        } else {
          console.error("[PASSWORD_RESET] authUserId unique constraint conflict:", prismaErr.message);
        }
      } else {
        logAuthError("PASSWORD_RESET_LOCAL_UPDATE_FAILED", {
          reason: "AUTH_UPDATED_LOCAL_CLEANUP_FAILED",
          userId: user.id,
          authUserId: targetAuthUserId,
          error: prismaErr.message,
        });
      }
    }

    // Step 7: Mark Reset Token Consumed
    await consumeTokenRecord(cleanEmail, tokenToUse);
    logAuthEvent("PASSWORD_RESET_TOKEN_CONSUMED", {
      userId: user.id,
      authUserId: targetAuthUserId,
      emailHash,
    });

    // Step 8: Clear Edge LOCKED claim & sync role metadata
    try {
      await syncAuthAppMetadata(targetAuthUserId, {
        accountStatus: "ACTIVE",
        lockedUntil: null,
        role: String(user.role || "USER").toUpperCase(),
      });
    } catch (syncErr) {
      console.warn("[PASSWORD_RESET] Claim metadata sync warning:", syncErr.message);
    }

    logAuthEvent("PASSWORD_RESET_COMPLETED", {
      userId: user.id,
      authUserId: targetAuthUserId,
      emailHash,
    });

    return jsonOk({
      success: true,
      message: "Your password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    if (cleanEmail && tokenToUse) {
      await releaseTokenClaim(cleanEmail, tokenToUse);
    }
    logAuthError("UNHANDLED_EXCEPTION", {
      message: error.message,
      emailHash,
    });
    return jsonError("Failed to reset password", 500, "PASSWORD_RESET_INTERNAL_ERROR");
  }
}
