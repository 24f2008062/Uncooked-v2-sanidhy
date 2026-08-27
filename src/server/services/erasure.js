import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/server/auth/audit";

export async function eraseUser(userId, { ipHash = null, actorId = null } = {}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  if (user.deletedAt) {
    return user;
  }

  const anonymizedEmail = `deleted+${userId}@invalid.local`;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.consentRecord.deleteMany({ where: { userId } });
    await tx.verificationToken.deleteMany({
      where: { identifier: user.email.toLowerCase() },
    }).catch(() => {});

    return tx.user.update({
      where: { id: userId },
      data: {
        name: "Deleted User",
        fullName: null,
        email: anonymizedEmail,
        passwordHash: null,
        phoneE164: null,
        dob: null,
        department: null,
        clubAssociation: null,
        interests: null,
        lastLoginIpHash: null,
        deletedAt: new Date(),
        deleteRequestedAt: new Date(),
        tokenVersion: { increment: 1 },
        failedLoginAttempts: 0,
        lockedUntil: new Date(),
        disabledAt: new Date(),
        disabledReason: "DPDP erasure",
      },
    });
  });

  await logAuditEvent({
    actorId: actorId || userId,
    action: "USER_ERASE",
    entityType: "User",
    entityId: userId,
    ipHash,
    metadata: { reason: "data_principal_erasure" },
  });

  return updated;
}

export function exportUserPayload(user) {
  return {
    id: user.id,
    name: user.name,
    fullName: user.fullName,
    email: user.email,
    department: user.department,
    clubAssociation: user.clubAssociation,
    interests: user.interests,
    role: user.role,
    ageAttested18: user.ageAttested18,
    termsAcceptedAt: user.termsAcceptedAt,
    termsVersion: user.termsVersion,
    privacyAcceptedAt: user.privacyAcceptedAt,
    privacyVersion: user.privacyVersion,
    createdAt: user.createdAt,
    registrations: (user.registrations || []).map((reg) => ({
      id: reg.id,
      eventId: reg.eventId,
      eventTitle: reg.event?.title,
      status: reg.status,
      registeredAt: reg.registeredAt,
    })),
    hostApplication: user.hostApplication
      ? {
          id: user.hostApplication.id,
          organizationName: user.hostApplication.organizationName,
          organizationType: user.hostApplication.organizationType,
          status: user.hostApplication.status,
          createdAt: user.hostApplication.createdAt,
        }
      : null,
    opportunityApplications: (user.opportunityApps || []).map((app) => ({
      id: app.id,
      opportunityTitle: app.opportunity?.title,
      status: app.status,
      appliedAt: app.appliedAt,
    })),
    consents: (user.consents || []).map((c) => ({
      kind: c.kind,
      version: c.version,
      acceptedAt: c.acceptedAt,
    })),
  };
}
