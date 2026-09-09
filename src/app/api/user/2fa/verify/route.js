import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_user_2fa_verify",
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;

    const { code, action = "enable", email: rawEmail } = parsed.body || {};

    let targetEmail = "";
    const auth = await requireUser();
    if (!auth.error && auth.user?.email) {
      targetEmail = auth.user.email;
    } else if (rawEmail) {
      targetEmail = String(rawEmail).toLowerCase().trim();
    }

    if (!targetEmail) {
      return jsonError("User email could not be resolved", 400);
    }

    if (action === "disable") {
      // Clean up tokens
      await prisma.verificationToken.deleteMany({
        where: { identifier: targetEmail, purpose: "TWO_FACTOR_EMAIL" },
      });
      return jsonOk({
        message: "Two-Factor Authentication disabled successfully",
        twoFactorEnabled: false,
      });
    }

    // Enabling 2FA: Verify the submitted code
    const cleanCode = String(code || "").trim();
    if (!cleanCode || cleanCode.length !== 6) {
      return jsonError("Please enter the 6-digit verification code", 400);
    }

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: targetEmail,
        token: cleanCode,
        purpose: "TWO_FACTOR_EMAIL",
        expires: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return jsonError("Invalid or expired verification code. Please request a new one.", 400);
    }

    // Atomically consume token
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: targetEmail,
        token: cleanCode,
        purpose: "TWO_FACTOR_EMAIL",
      },
    });

    return jsonOk({
      message: "Two-Factor Authentication enabled successfully",
      twoFactorEnabled: true,
      email: targetEmail,
    });
  } catch (error) {
    return safeError(error, "Failed to verify 2FA code");
  }
}
