import crypto from "crypto";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson } from "@/server/http/envelope";
import { enforceMutationGuards } from "@/server/http/guards";
import { sendPasswordResetEmail } from "@/lib/email/service";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_forgot_password",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;

    const email = String(parsed.body.email || "").toLowerCase().trim();
    if (!email || !email.includes("@")) {
      return jsonError("Valid email is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Safe response to prevent account enumeration
      return jsonOk({
        message: "If an account exists with that email, a password reset link has been sent.",
      });
    }

    // Delete existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        purpose: "PASSWORD_RESET",
      },
    });

    // Generate random 32-byte token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        purpose: "PASSWORD_RESET",
        expires,
      },
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const resetUrl = `${protocol}://${host}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail({
      email,
      name: user.name || user.fullName || "User",
      token,
      resetUrl,
    });

    return jsonOk({
      message: "If an account exists with that email, a password reset link has been sent.",
      ...(process.env.NODE_ENV !== "production" ? { devResetPath: `/reset-password?token=${token}&email=${encodeURIComponent(email)}` } : {}),
    });
  } catch (error) {
    console.error("[ForgotPassword] Error generating reset token:", error);
    return jsonError("Unable to process password reset request", 500);
  }
}
