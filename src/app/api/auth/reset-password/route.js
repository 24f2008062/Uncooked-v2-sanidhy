import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards } from "@/server/http/guards";
import { consumeToken } from "@/server/auth/tokens";
import { hashPassword, validatePasswordPolicy } from "@/server/utils/passwordUtils";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_auth_reset",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const email = String(body.email || "").toLowerCase().trim();
    const token = String(body.token || "");
    const password = body.password;

    const passwordError = validatePasswordPolicy(password);
    if (!email || !token || passwordError) {
      return jsonError(passwordError || "Invalid reset request", 400);
    }

    const ok = await consumeToken(email, token, "PASSWORD_RESET");
    if (!ok) {
      return jsonError("This reset link is invalid or has expired.", 400, "INVALID_STATE");
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return jsonOk({ message: "Password updated. Please sign in." });
  } catch (error) {
    return safeError(error, "Unable to reset password");
  }
}
