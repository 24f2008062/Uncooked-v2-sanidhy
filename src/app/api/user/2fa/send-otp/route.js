import crypto from "crypto";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { sendEmail } from "@/lib/email/service";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_user_2fa_send_otp",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    let targetEmail = "";
    const auth = await requireUser();
    if (!auth.error && auth.user?.email) {
      targetEmail = auth.user.email;
    } else {
      const parsed = await readJson(req);
      if (!parsed.error && parsed.body?.email) {
        targetEmail = String(parsed.body.email).toLowerCase().trim();
      }
    }

    if (!targetEmail || !targetEmail.includes("@")) {
      return jsonError("Valid email is required to send 2FA verification code", 400);
    }

    // Generate cryptographically secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up any existing 2FA tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: targetEmail,
        purpose: "TWO_FACTOR_EMAIL",
      },
    });

    // Store in VerificationToken table
    await prisma.verificationToken.create({
      data: {
        identifier: targetEmail,
        token: otp,
        purpose: "TWO_FACTOR_EMAIL",
        expires,
      },
    });

    // Send the verification OTP email
    let emailSent = false;
    try {
      await sendEmail({
        to: targetEmail,
        subject: "Your Opportia 2FA Security Code",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #111115; color: #f4f4f5; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <h2 style="margin: 0 0 12px 0; color: #fb923c; font-size: 20px;">Two-Factor Authentication</h2>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #a1a1aa; line-height: 1.5;">
              Use the following verification code to enable Two-Factor Authentication on your Opportia account:
            </p>
            <div style="background: #18181b; padding: 18px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid rgba(255,255,255,0.15);">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ffffff; font-family: monospace;">${otp}</span>
            </div>
            <p style="margin: 0; font-size: 12px; color: #71717a;">
              This code will expire in 10 minutes. If you did not request this code, please secure your account immediately.
            </p>
          </div>
        `,
        text: `Your Opportia Two-Factor Authentication code is: ${otp}. It expires in 10 minutes.`,
      });
      emailSent = true;
    } catch (err) {
      console.warn("[2FA_SEND_EMAIL_WARN]", err?.message);
    }

    return jsonOk({
      message: `Verification code sent to ${targetEmail}`,
      email: targetEmail,
      emailSent,
      // Provide OTP in dev/local mode if SMTP is not configured
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error) {
    return safeError(error, "Failed to send 2FA verification code");
  }
}
