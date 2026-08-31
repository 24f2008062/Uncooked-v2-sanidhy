import prisma from "@/lib/prisma";

export async function logAuditEvent({
  actorId = null,
  action,
  entityType = null,
  entityId = null,
  applicationId = null,
  previousStatus = null,
  newStatus = null,
  metadata = {},
  ipHash = null,
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        adminId: actorId,
        actorId,
        applicationId,
        action,
        entityType,
        entityId,
        previousStatus,
        newStatus,
        details: JSON.stringify(metadata || {}),
        ipHash,
      },
    });
  } catch (err) {
    console.error("[audit] persist failed");
    return null;
  }
}
