import crypto from "crypto";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson } from "@/server/http/envelope";
import { enforceMutationGuards } from "@/server/http/guards";
import { sendVerificationEmail } from "@/lib/email/service";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_send_verification",
      limit: 3,
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
      // Return success to avoid email enumeration
      return jsonOk({ message: "If an account exists, a verification link has been sent." });
    }

    if (user.emailVerified) {
      return jsonOk({ message: "Email is already verified." });
    }

    // Generate secure 32-byte token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store in VerificationToken table
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        purpose: "EMAIL_VERIFICATION",
        expires,
      },
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const verificationUrl = `${protocol}://${host}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await sendVerificationEmail({
      email,
      name: user.name || user.fullName || "User",
      token,
      verificationUrl,
    });

    return jsonOk({
      message: "Verification email sent successfully.",
      ...(process.env.NODE_ENV !== "production" ? { devVerificationUrl: verificationUrl } : {}),
    });
  } catch (error) {
    console.error("[Verification] Error sending verification email:", error);
    return jsonError("Failed to send verification email", 500);
  }
}
