import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson } from "@/server/http/envelope";
import { enforceMutationGuards } from "@/server/http/guards";
import { validatePasswordPolicy, hashPassword } from "@/server/utils/passwordUtils";
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

    // Verify token from DB
    const verificationRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: cleanEmail,
        token: token,
        purpose: "PASSWORD_RESET",
      },
    });

    if (!verificationRecord) {
      return jsonError("Invalid or expired password reset token", 400);
    }

    if (new Date() > new Date(verificationRecord.expires)) {
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: cleanEmail,
          purpose: "PASSWORD_RESET",
        },
      });
      return jsonError("Password reset token has expired. Please request a new one.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return jsonError("User account not found", 404);
    }

    // Hash new password
    const newHash = await hashPassword(passToUse);

    // Update passwordHash in Prisma
    await prisma.user.update({
      where: { email: cleanEmail },
      data: {
        passwordHash: newHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Also sync password with Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes("placeholder")) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        let targetAuthUserId = user.authUserId;

        // If authUserId was not set, search auth.users by email
        if (!targetAuthUserId) {
          const authRecords = await prisma.$queryRaw`SELECT id FROM auth.users WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;
          if (authRecords && authRecords.length > 0) {
            targetAuthUserId = authRecords[0].id;
          }
        }

        if (targetAuthUserId) {
          await supabaseAdmin.auth.admin.updateUserById(targetAuthUserId, {
            password: passToUse,
            email_confirm: true,
          });

          if (!user.authUserId) {
            await prisma.user.update({
              where: { email: cleanEmail },
              data: { authUserId: targetAuthUserId },
            });
          }
        } else {
          // Create Supabase Auth user if not present
          const { data: newAuthUser } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: passToUse,
            email_confirm: true,
            user_metadata: {
              name: user.name || user.fullName || "User",
            },
          });

          if (newAuthUser?.user) {
            await prisma.user.update({
              where: { email: cleanEmail },
              data: { authUserId: newAuthUser.user.id },
            });
          }
        }
      } catch (supaErr) {
        console.warn("[ResetPassword] Supabase password update warning:", supaErr.message);
      }
    }

    // Delete used reset tokens
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: cleanEmail,
        purpose: "PASSWORD_RESET",
      },
    });

    return jsonOk({
      success: true,
      message: "Your password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("[ResetPassword] Error resetting password:", error);
    return jsonError("Failed to reset password", 500);
  }
}
