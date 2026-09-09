import { after } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { requireSuperAdmin, enforceMutationGuards } from "@/server/http/guards";
import { processBroadcastJob, resolveBroadcastRecipients } from "@/server/services/broadcastQueue";

export async function GET(req) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    if (jobId) {
      const job = await prisma.broadcastJob.findUnique({ where: { id: jobId } });
      if (!job) return NextResponse.json({ error: "Broadcast job not found" }, { status: 404 });
      return NextResponse.json({ job });
    }

    const history = await prisma.auditLog.findMany({
      where: { action: { startsWith: "BROADCAST_" } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const jobs = await prisma.broadcastJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        audience: true,
        subject: true,
        totalRecipients: true,
        successCount: true,
        failureCount: true,
        createdAt: true,
        completedAt: true,
        idempotencyKey: true,
      },
    });

    return NextResponse.json({ history, jobs });
  } catch (error) {
    console.error("[Communications API] Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch communications history" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const user = auth.user;

    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_admin_communications",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const body = await req.json();
    const { audience, subject, message, targetEmails, mediaUrl } = body;
    const inAppNotification = body.inAppNotification !== false;
    const idempotencyKey =
      String(req.headers.get("idempotency-key") || body.idempotencyKey || "").trim() ||
      crypto.createHash("sha256").update(`${user.id}|${audience}|${subject}|${message}`).digest("hex").slice(0, 48);

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message content are required" }, { status: 400 });
    }

    const existing = await prisma.broadcastJob.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return NextResponse.json({
        success: true,
        queued: true,
        idempotentReplay: true,
        jobId: existing.id,
        status: existing.status,
        message: "Broadcast job already exists for this idempotency key.",
      });
    }

    const recipientEmails = await resolveBroadcastRecipients(audience || "ALL_USERS", targetEmails);
    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: "No recipients found for the selected audience" }, { status: 400 });
    }

    const job = await prisma.broadcastJob.create({
      data: {
        idempotencyKey,
        adminId: user.id,
        audience: String(audience || "ALL_USERS"),
        subject: String(subject).slice(0, 200),
        message: String(message).slice(0, 20000),
        mediaUrl: mediaUrl ? String(mediaUrl).slice(0, 500) : null,
        status: "PENDING",
        totalRecipients: recipientEmails.length,
        details: JSON.stringify({
          recipients: recipientEmails,
          delivered: [],
          inAppNotification,
        }),
      },
    });

    const senderName = user.fullName || user.name || "Opportia Admin Desk";
    after(async () => {
      try {
        await processBroadcastJob(job.id, { senderName, inAppNotification });
      } catch (err) {
        console.error("[Broadcast] background job failed:", err.message);
        await prisma.broadcastJob
          .update({
            where: { id: job.id },
            data: { status: "FAILED", completedAt: new Date() },
          })
          .catch(() => {});
      }
    });

    return NextResponse.json(
      {
        success: true,
        queued: true,
        jobId: job.id,
        status: "PENDING",
        totalRecipients: recipientEmails.length,
        inAppNotification,
        message: inAppNotification
          ? `Broadcast queued for ${recipientEmails.length} recipient(s) (email + in-app).`
          : `Broadcast queued for ${recipientEmails.length} recipient(s) (email only).`,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[Communications API] Error queueing broadcast:", error);
    return NextResponse.json({ error: "Failed to dispatch broadcast" }, { status: 500 });
  }
}
