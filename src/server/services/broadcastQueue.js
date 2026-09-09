import prisma from "@/lib/prisma";
import { sendAdminBroadcastEmail } from "@/lib/email/service";
import { logAuditEvent } from "@/server/auth/audit";
import { createInAppNotificationForEmails } from "@/server/services/notifications";

const BATCH_SIZE = 25;
const MAX_RECIPIENTS = 500;

export async function resolveBroadcastRecipients(audience, targetEmails = []) {
  if (audience === "SPECIFIC" && Array.isArray(targetEmails) && targetEmails.length > 0) {
    return [...new Set(targetEmails.map((e) => String(e).trim().toLowerCase()).filter(Boolean))].slice(
      0,
      MAX_RECIPIENTS
    );
  }
  if (audience === "VERIFIED_HOSTS") {
    const hosts = await prisma.user.findMany({
      where: { role: "ORGANIZER", deletedAt: null },
      select: { email: true },
      take: MAX_RECIPIENTS,
    });
    return hosts.map((h) => h.email).filter(Boolean);
  }
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { email: true },
    take: MAX_RECIPIENTS,
  });
  return users.map((u) => u.email).filter(Boolean);
}

/**
 * Process a queued broadcast job with bounded batches and backoff.
 * Idempotent: RUNNING/DONE jobs are no-ops if already past PENDING (except RUNNING resume).
 */
export async function processBroadcastJob(
  jobId,
  { senderName = "Opportia Admin Desk", inAppNotification = true } = {}
) {
  const job = await prisma.broadcastJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  if (job.status === "DONE") return job;

  const claimed = await prisma.broadcastJob.updateMany({
    where: { id: jobId, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "RUNNING", startedAt: new Date(), failureCount: 0 },
  });
  // Allow resume if already RUNNING (crash mid-flight) — only one worker should call this.
  if (claimed.count === 0 && job.status !== "RUNNING") {
    return prisma.broadcastJob.findUnique({ where: { id: jobId } });
  }

  const fresh = await prisma.broadcastJob.findUnique({ where: { id: jobId } });
  let recipients = [];
  try {
    const details = fresh.details ? JSON.parse(fresh.details) : {};
    recipients = Array.isArray(details.recipients) ? details.recipients : [];
  } catch {
    recipients = [];
  }

  let successCount = fresh.successCount || 0;
  let failureCount = fresh.failureCount || 0;
  let parsedDetails = {};
  try {
    parsedDetails = fresh.details ? JSON.parse(fresh.details) : {};
  } catch {
    parsedDetails = {};
  }

  const wantInApp =
    parsedDetails.inAppNotification !== undefined
      ? Boolean(parsedDetails.inAppNotification)
      : inAppNotification !== false;

  // In-app inbox dual-write (once per job).
  if (wantInApp && !parsedDetails.inAppNotificationId) {
    try {
      const { notification, recipientCount } = await createInAppNotificationForEmails({
        emails: recipients,
        title: fresh.subject,
        body: fresh.message,
        mediaUrl: fresh.mediaUrl,
        kind: "ANNOUNCEMENT",
        broadcastId: fresh.id,
        createdById: fresh.adminId,
      });
      if (notification) {
        parsedDetails.inAppNotificationId = notification.id;
        parsedDetails.inAppRecipientCount = recipientCount;
        await prisma.broadcastJob.update({
          where: { id: jobId },
          data: { details: JSON.stringify({ ...parsedDetails, recipients }) },
        });
      }
    } catch (err) {
      console.error("[Broadcast] in-app notification fan-out failed:", err.message);
    }
  }

  const alreadyDone = new Set(Array.isArray(parsedDetails.delivered) ? parsedDetails.delivered : []);
  const delivered = [...alreadyDone];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    for (const email of batch) {
      if (alreadyDone.has(email)) continue;
      try {
        const sent = await sendAdminBroadcastEmail({
          to: email,
          subject: fresh.subject,
          message: fresh.message,
          mediaUrl: fresh.mediaUrl || undefined,
          senderName,
        });
        if (sent && sent.success === false) {
          failureCount += 1;
        } else {
          successCount += 1;
          delivered.push(email);
        }
      } catch {
        failureCount += 1;
      }
    }
    await prisma.broadcastJob.update({
      where: { id: jobId },
      data: {
        successCount,
        failureCount,
        details: JSON.stringify({ recipients, delivered }),
      },
    });
    // Light backoff between batches to reduce provider hammering.
    await new Promise((r) => setTimeout(r, 150));
  }

  const done = await prisma.broadcastJob.update({
    where: { id: jobId },
    data: {
      status: failureCount > 0 && successCount === 0 ? "FAILED" : "DONE",
      successCount,
      failureCount,
      completedAt: new Date(),
      details: JSON.stringify({ recipients, delivered }),
    },
  });

  try {
    await logAuditEvent({
      actorId: fresh.adminId,
      action: `BROADCAST_${done.status}_${fresh.audience}`,
      entityType: "BroadcastJob",
      entityId: jobId,
      metadata: {
        subject: fresh.subject,
        successCount,
        failureCount,
        total: recipients.length,
      },
    });
  } catch {
    /* ignore */
  }

  return done;
}
