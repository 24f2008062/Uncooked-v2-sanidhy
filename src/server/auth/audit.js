import prisma from '@/lib/prisma';

export async function logAuditEvent({ actorId, action, entityType, entityId, metadata = {}, ipAddress = null }) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('[logAuditEvent] Failed to persist audit log entry:', err);
    return null;
  }
}
