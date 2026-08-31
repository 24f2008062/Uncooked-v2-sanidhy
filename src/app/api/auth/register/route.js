import prisma from "@/lib/prisma";
import { hashPassword, validatePasswordPolicy } from "@/server/utils/passwordUtils";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards } from "@/server/http/guards";
import { getClientIp, hashIp } from "@/server/http/ip";
import { LEGAL, TERMS_VERSION, PRIVACY_VERSION } from "@/server/config/legal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTER_MESSAGE = "If this email is eligible, you can sign in with your password.";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_auth_register",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const userEmail = String(body.email || "").toLowerCase().trim();
    const userName = String(body.fullName || body.name || "").trim().slice(0, 80);
    const userDept = String(body.department || body.location || "").trim().slice(0, 120);
    const password = body.password;
    const ageAttested18 = Boolean(body.ageAttested18);
    const acceptTerms = Boolean(body.acceptTerms);

    if (!userEmail || !EMAIL_RE.test(userEmail) || userEmail.length > 254) {
      return jsonError("Please enter a valid email address", 400);
    }
    if (!userName) {
      return jsonError("Full name is required", 400);
    }
    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return jsonError(passwordError, 400);
    }
    if (!ageAttested18) {
      return jsonError("You must confirm that you are 18 years of age or older.", 400);
    }
    if (!acceptTerms) {
      return jsonError("You must accept the Terms of Service and Privacy Policy.", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (existingUser) {
      return jsonOk({ message: REGISTER_MESSAGE });
    }

    const hashedPassword = await hashPassword(password);
    const ipHash = hashIp(getClientIp(req));

    const user = await prisma.user.create({
      data: {
        email: userEmail,
        name: userName,
        fullName: userName,
        department: userDept || null,
        passwordHash: hashedPassword,
        role: "USER",
        ageAttested18: true,
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        privacyAcceptedAt: new Date(),
        privacyVersion: PRIVACY_VERSION,
        consents: {
          create: [
            { kind: "TERMS", version: TERMS_VERSION, ipHash },
            { kind: "PRIVACY", version: PRIVACY_VERSION, ipHash },
            { kind: "AGE_18", version: TERMS_VERSION, ipHash },
          ],
        },
      },
      select: { id: true },
    });
    void user;

    return jsonOk({ message: REGISTER_MESSAGE });
  } catch (error) {
    if (error?.code === "P2002") {
      return jsonOk({ message: REGISTER_MESSAGE });
    }
    return safeError(error, "Unable to complete registration");
  }
}
