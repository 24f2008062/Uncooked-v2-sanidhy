import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

const ORG_TYPES = new Set(["College Club", "NGO", "Company", "University", "Independent", "Other"]);

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const application = await prisma.hostApplication.findUnique({
      where: { userId: auth.user.id },
      select: {
        id: true,
        organizationName: true,
        organizationType: true,
        status: true,
        notes: true,
        documentUrls: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonOk({ application });
    let parsedNotes = null;
    if (application?.notes) {
      try {
        parsedNotes = JSON.parse(application.notes);
      } catch {
        parsedNotes = { text: application.notes };
      }
    }

    return jsonOk({
      application: application
        ? {
            ...application,
            parsedNotes,
          }
        : null,
    });
  } catch (error) {
    return safeError(error, "Unable to load host application");
  }
}

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_host_apply", limit: 10, windowMs: 60 * 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    if (auth.user.role === "ORGANIZER" || auth.user.role === "SUPER_ADMIN") {
      return jsonError("You are already a verified host.", 409, "CONFLICT");
    }

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body || {};
    const organizationName = String(body.organizationName || body.orgName || "").trim().slice(0, 120);
    const organizationType = String(body.organizationType || body.orgType || "College Club").trim();
    
    // Optional rich fields if passed via apply form
    const applicantName = String(body.applicantName || body.fullName || auth.user.fullName || auth.user.name || "").trim().slice(0, 100);
    const applicantRole = String(body.applicantRole || body.roleInOrg || "").trim().slice(0, 100);
    const contactEmail = String(body.contactEmail || body.email || auth.user.email || "").trim().toLowerCase();
    const contactPhone = String(body.contactPhone || body.phone || "").trim().slice(0, 30);
    const linkedinUrl = String(body.linkedinUrl || body.linkedin || "").trim().slice(0, 300);
    const proofDocumentUrl = String(body.proofDocumentUrl || body.documentUrl || "").trim().slice(0, 500);
    const hostingReason = String(body.hostingReason || body.notes || body.description || "").trim().slice(0, 2000);

    if (!organizationName || !ORG_TYPES.has(organizationType)) {
      return jsonError("Organization name and a valid organization type are required", 400);
    }

    const existing = await prisma.hostApplication.findUnique({ where: { userId: auth.user.id } });
    if (existing && existing.status === "APPROVED") {
      return jsonError("You are already a verified host.", 409, "CONFLICT");
    }

    const notesPayload = JSON.stringify({
      applicantName,
      applicantRole,
      contactEmail,
      contactPhone,
      linkedinUrl,
      proofDocumentUrl: proofDocumentUrl || null,
      hostingReason,
      submittedAt: new Date().toISOString(),
    });

    const application = await prisma.hostApplication.upsert({
      where: { userId: auth.user.id },
      update: {
        organizationName,
        organizationType,
        notes: notesPayload,
        documentUrls: proofDocumentUrl || linkedinUrl || null,
        status: "PENDING",
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
      },
      create: {
        userId: auth.user.id,
        organizationName,
        organizationType,
        notes: notesPayload,
        documentUrls: proofDocumentUrl || linkedinUrl || null,
        status: "PENDING",
      },
    });

    await logAuditEvent({
      actorId: auth.user.id,
      action: "HOST_APPLY",
      entityType: "HostApplication",
      entityId: application.id,
      applicationId: application.id,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({
      message: "Host application submitted. An administrator will review it.",
      applicationId: application.id,
      status: application.status,
    }, 201);
  } catch (error) {
    return safeError(error, "Unable to submit host application");
  }
}
