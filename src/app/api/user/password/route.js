import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { validatePasswordPolicy, hashPassword, verifyPassword } from "@/server/utils/passwordUtils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_user_update_password",
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) {
      return auth.error;
    }

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;

    const { currentPassword, newPassword, confirmPassword } = parsed.body || {};

    if (!newPassword) {
      return jsonError("New password is required", 400);
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return jsonError("Passwords do not match", 400);
    }

    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) {
      return jsonError(policyError, 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    if (!user) {
      return jsonError("User not found", 404);
    }

    // If user already has a password set, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return jsonError("Current password is required to change password", 400);
      }
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return jsonError("Current password is incorrect", 400);
      }
    }

    // Hash new password using scrypt
    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        tokenVersion: { increment: 1 },
      },
    });

    // If Supabase Auth account exists, update password there too
    if (user.authUserId) {
      try {
        const admin = getSupabaseAdmin();
        if (admin) {
          await admin.auth.admin.updateUserById(user.authUserId, {
            password: newPassword,
          });
        }
      } catch (err) {
        console.warn("[UPDATE_PASSWORD_SUPABASE_SYNC_WARN]", err?.message);
      }
    }

    return jsonOk({
      message: "Password updated successfully",
      hasPassword: true,
    });
  } catch (error) {
    return safeError(error, "Failed to update password");
  }
}
