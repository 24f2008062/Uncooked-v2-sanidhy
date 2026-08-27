import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/authentication";
import { hasPermission } from "@/server/auth/authorization";
import { logAuditEvent } from "@/server/auth/audit";

let isGlobalKillSwitchActive = false;

export async function GET(req) {
  return NextResponse.json({ killSwitchActive: isGlobalKillSwitchActive });
}

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && !hasPermission(user, "INCIDENTS_MANAGE")) {
      return NextResponse.json(
        { error: "Forbidden - Only Super Admins can toggle global platform emergency kill-switch" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { active, reason } = body;

    isGlobalKillSwitchActive = !!active;

    await logAuditEvent({
      action: "KILL_SWITCH_TOGGLE",
      actorId: user.id,
      details: {
        killSwitchActive: isGlobalKillSwitchActive,
        reason: reason || "Administrative incident override",
      },
    });

    return NextResponse.json({
      message: `Emergency Kill-Switch ${isGlobalKillSwitchActive ? "ACTIVATED" : "DEACTIVATED"}`,
      killSwitchActive: isGlobalKillSwitchActive,
    });
  } catch (error) {
    console.error("POST /api/v2/admin/incidents/kill-switch error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to update emergency kill-switch status" },
      { status: 500 }
    );
  }
}
