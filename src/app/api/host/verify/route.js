import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) {
      return jsonOk({ verified: false, authenticated: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        fullName: true,
        hostApplication: {
          select: {
            id: true,
            status: true,
            notes: true,
            documentUrls: true,
            createdAt: true,
          },
        },
      },
    });

    const isVerified =
      user?.role === "ORGANIZER" ||
      user?.role === "SUPER_ADMIN" ||
      user?.hostApplication?.status === "APPROVED";

    return jsonOk({
      verified: isVerified,
      authenticated: true,
      role: user?.role,
      userEmail: user?.email,
      application: user?.hostApplication,
    });
  } catch (error) {
    return safeError(error, "Unable to check host verification status");
  }
}

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_host_verify",
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body || {};

    const cleanGmail = String(body.gmail || "").trim().toLowerCase();
    const cleanLinkedin = String(body.linkedin || "").trim();
    const cleanInstagram = String(body.instagram || "").trim().slice(0, 100);
    const cleanTwitter = String(body.twitter || "").trim().slice(0, 100);

    // Gmail is MANDATORY
    if (!cleanGmail || !EMAIL_REGEX.test(cleanGmail)) {
      return jsonError("A valid Gmail address is mandatory.", 400);
    }
    if (!cleanGmail.endsWith("@gmail.com") && !cleanGmail.endsWith("@googlemail.com")) {
      return jsonError("A valid Gmail address (@gmail.com) is mandatory for host verification.", 400);
    }

    // LinkedIn is MANDATORY
    if (!cleanLinkedin || cleanLinkedin.length < 3) {
      return jsonError("LinkedIn account/profile is mandatory.", 400);
    }

    const hostNotes = JSON.stringify({
      gmail: cleanGmail,
      linkedin: cleanLinkedin,
      instagram: cleanInstagram || null,
      twitter: cleanTwitter || null,
      verifiedVia: "DIRECT_HOST_VERIFICATION",
      verifiedAt: new Date().toISOString(),
    });

    const orgName =
      auth.user.fullName ||
      auth.user.name ||
      `Host (${cleanGmail.split("@")[0]})`;

    const application = await prisma.hostApplication.upsert({
      where: { userId: auth.user.id },
      update: {
        organizationName: orgName,
        organizationType: "Independent",
        notes: hostNotes,
        documentUrls: cleanLinkedin,
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: "SYSTEM_AUTO_VERIFIED",
        rejectionReason: null,
      },
      create: {
        userId: auth.user.id,
        organizationName: orgName,
        organizationType: "Independent",
        notes: hostNotes,
        documentUrls: cleanLinkedin,
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: "SYSTEM_AUTO_VERIFIED",
      },
    });

    // Elevate user to ORGANIZER role so event publishing succeeds immediately
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        role: "ORGANIZER",
        tokenVersion: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: auth.user.id,
      action: "HOST_VERIFY",
      entityType: "HostApplication",
      entityId: application.id,
      applicationId: application.id,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({
      message: "Host verified successfully! You are now authorized to publish events.",
      verified: true,
      role: "ORGANIZER",
      application,
    });
  } catch (error) {
    return safeError(error, "Unable to verify host credentials");
  }
}
