import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

import {
  VALID_ORG_TYPES,
  validateHostApplication,
  parseHostApplicationNotes,
} from "@/server/auth/hostVerification";

export { VALID_ORG_TYPES };

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) {
      return jsonOk({ verified: false, authenticated: false, applicationStatus: "NOT_APPLIED" });
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
            organizationName: true,
            organizationType: true,
            status: true,
            notes: true,
            documentUrls: true,
            rejectionReason: true,
            createdAt: true,
            reviewedAt: true,
          },
        },
      },
    });

    const isVerified =
      user?.role === "ORGANIZER" ||
      user?.role === "SUPER_ADMIN" ||
      user?.hostApplication?.status === "APPROVED";

    let parsedNotes = null;
    if (user?.hostApplication?.notes) {
      try {
        parsedNotes = JSON.parse(user.hostApplication.notes);
      } catch {
        parsedNotes = { text: user.hostApplication.notes };
      }
    }

    return jsonOk({
      verified: isVerified,
      authenticated: true,
      role: user?.role,
      userEmail: user?.email,
      userName: user?.fullName || user?.name,
      applicationStatus: user?.hostApplication?.status || "NOT_APPLIED",
      application: user?.hostApplication
        ? {
            ...user.hostApplication,
            parsedNotes,
          }
        : null,
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

    if (auth.user.role === "ORGANIZER" || auth.user.role === "SUPER_ADMIN") {
      return jsonError("You are already an authorized event host.", 409, "ALREADY_VERIFIED");
    }

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body || {};

    const validation = validateHostApplication(body);
    if (!validation.valid) {
      return jsonError(validation.error, 400);
    }
    const {
      organizationName,
      organizationType,
      applicantName,
      applicantRole,
      contactEmail,
      contactPhone,
      linkedinUrl,
      proofDocumentUrl,
      websiteUrl,
      instagram,
      twitter,
      hostingReason,
    } = validation.data;

    const structuredNotes = JSON.stringify({
      applicantName,
      applicantRole,
      contactEmail,
      contactPhone,
      linkedinUrl,
      websiteUrl: websiteUrl || null,
      instagram: instagram || null,
      twitter: twitter || null,
      proofDocumentUrl: proofDocumentUrl || null,
      hostingReason,
      submittedAt: new Date().toISOString(),
    });

    const primaryDocument = proofDocumentUrl || linkedinUrl;

    const application = await prisma.hostApplication.upsert({
      where: { userId: auth.user.id },
      update: {
        organizationName,
        organizationType,
        notes: structuredNotes,
        documentUrls: primaryDocument,
        status: "PENDING",
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
      },
      create: {
        userId: auth.user.id,
        organizationName,
        organizationType,
        notes: structuredNotes,
        documentUrls: primaryDocument,
        status: "PENDING",
      },
    });

    await logAuditEvent({
      actorId: auth.user.id,
      action: "HOST_APPLICATION_SUBMITTED",
      entityType: "HostApplication",
      entityId: application.id,
      applicationId: application.id,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({
      message: "Host verification application submitted. An administrator will review your credentials before event hosting privileges are enabled.",
      verified: false,
      status: "PENDING",
      application: {
        id: application.id,
        organizationName: application.organizationName,
        organizationType: application.organizationType,
        status: application.status,
        createdAt: application.createdAt,
      },
    }, 201);
  } catch (error) {
    return safeError(error, "Unable to submit host verification application");
  }
}
