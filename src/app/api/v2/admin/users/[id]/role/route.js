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

    if (actor.role !== "SUPER_ADMIN" && !hasPermission(actor, "USERS_ROLES")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions to alter user roles" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { role, permissions } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        ...(permissions !== undefined && {
          permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : permissions,
        }),
      },
    });

    await logAuditEvent({
      action: "ROLE_CHANGE",
      actorId: actor.id,
      targetId: id,
      details: {
        previousRole: targetUser.role,
        newRole: role,
        permissions: permissions || [],
      },
    });

    return NextResponse.json({
      message: "Role updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        permissions: updatedUser.permissions,
      },
    });
  } catch (error) {
    console.error("POST /api/v2/admin/users/[id]/role error:", error.message || error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
