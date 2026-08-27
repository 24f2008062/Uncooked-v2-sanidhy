import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards } from "@/server/http/guards";
import { issueToken } from "@/server/auth/tokens";

const GENERIC = "If an account exists for that email, a reset link will be sent.";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_auth_forgot",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const email = String(body.email || "").toLowerCase().trim();
    if (!email) {
      return jsonOk({ message: GENERIC });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt && user.passwordHash) {
      const raw = await issueToken(email, "PASSWORD_RESET", 60 * 60 * 1000);
      if (process.env.NODE_ENV !== "production") {
        console.info("[forgot-password] token issued for local reset flow");
        return jsonOk({
          message: GENERIC,
          devResetPath: `/reset-password?email=${encodeURIComponent(email)}&token=${raw}`,
        });
      }
      // Production: wire Resend here. Never include the token in the HTTP response.
    }

    return jsonOk({ message: GENERIC });
  } catch (error) {
    return safeError(error, GENERIC);
  }
}
