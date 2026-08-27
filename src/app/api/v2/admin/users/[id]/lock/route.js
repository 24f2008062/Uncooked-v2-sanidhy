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

    if (actor.role !== "SUPER_ADMIN" && !hasPermission(actor, "USERS_WRITE")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions to lock user accounts" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { lock, hours } = body;

    const lockedUntil = lock ? new Date(Date.now() + (hours || 24) * 3600 * 1000) : null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        lockedUntil,
        failedLoginAttempts: lock ? 5 : 0,
      },
    });

    await logAuditEvent({
      action: lock ? "ACCOUNT_LOCK" : "ACCOUNT_UNLOCK",
      actorId: actor.id,
      targetId: id,
      details: { lockedUntil, hours },
    });

    return NextResponse.json({
      message: lock ? "Account locked successfully" : "Account unlocked successfully",
      lockedUntil: updatedUser.lockedUntil,
    });
  } catch (error) {
    console.error("POST /api/v2/admin/users/[id]/lock error:", error.message || error);
    return NextResponse.json({ error: "Failed to update account lock state" }, { status: 500 });
  }
}
