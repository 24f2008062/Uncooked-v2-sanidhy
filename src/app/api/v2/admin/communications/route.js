import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendAdminBroadcastEmail } from "@/lib/email/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }

    const history = await prisma.auditLog.findMany({
      where: { action: { startsWith: "BROADCAST_" } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[Communications API] Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch communications history" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }

    const { audience, subject, message, targetEmails } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message content are required" }, { status: 400 });
    }

    let recipientEmails = [];

    if (audience === "SPECIFIC" && Array.isArray(targetEmails) && targetEmails.length > 0) {
      recipientEmails = targetEmails.map(e => e.trim().toLowerCase());
    } else if (audience === "VERIFIED_HOSTS") {
      const hosts = await prisma.user.findMany({
        where: { role: "ORGANIZER", deletedAt: null },
        select: { email: true },
      });
      recipientEmails = hosts.map(h => h.email);
    } else {
      // Default: ALL_USERS
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        select: { email: true },
        take: 500, // Safety cap per batch
      });
      recipientEmails = users.map(u => u.email);
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: "No recipients found for the selected audience" }, { status: 400 });
    }

    // Send emails in background / parallel batches
    let successCount = 0;
    for (const email of recipientEmails) {
      try {
        await sendAdminBroadcastEmail({
          to: email,
          subject,
          message,
          senderName: user.user_metadata?.name || "Uncooked Admin Desk",
        });
        successCount++;
      } catch (err) {
        console.error(`[Broadcast] Failed to send email to ${email}:`, err);
      }
    }

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        actorId: user.id,
        action: `BROADCAST_SENT_${audience}`,
        details: JSON.stringify({ subject, recipientCount: successCount, totalTargeted: recipientEmails.length }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast successfully dispatched to ${successCount} recipient(s).`,
      recipientCount: successCount,
    });
  } catch (error) {
    console.error("[Communications API] Error sending broadcast:", error);
    return NextResponse.json({ error: "Failed to dispatch broadcast" }, { status: 500 });
  }
}
