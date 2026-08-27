import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/authentication";
import { hasPermission } from "@/server/auth/authorization";
import { logAuditEvent } from "@/server/auth/audit";

export async function POST(req, { params }) {
  try {
    const actor = await getCurrentUser(req);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (actor.role !== "SUPER_ADMIN" && !hasPermission(actor, "HOSTS_AUDIT")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions for host application review" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { action, notes, rejectionReason } = body; // APPROVED, REJECTED, INFO_REQUESTED

    const application = await prisma.hostApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Host application not found" }, { status: 404 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "INFO_REQUESTED";

    const updatedApp = await prisma.hostApplication.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: actor.id,
        ...(notes !== undefined && { notes }),
        ...(rejectionReason !== undefined && { rejectionReason }),
      },
    });

    // If approved, elevate applicant role to ORGANIZER
    if (newStatus === "APPROVED") {
      await prisma.user.update({
        where: { id: application.userId },
        data: { role: "ORGANIZER" },
      });
    }

    await logAuditEvent({
      action: newStatus === "APPROVED" ? "KYC_APPROVAL" : "KYC_REJECTION",
      actorId: actor.id,
      targetId: application.userId,
      details: { applicationId: id, status: newStatus, notes },
    });

    return NextResponse.json({
      message: `Host application ${newStatus}`,
      application: updatedApp,
    });
  } catch (error) {
    console.error("POST /api/v2/admin/applications/[id]/review error:", error.message || error);
    return NextResponse.json({ error: "Failed to review host application" }, { status: 500 });
  }
}
