import prisma from "@/lib/prisma";
import { jsonOk, safeError } from "@/server/http/envelope";
import { requireSuperAdmin } from "@/server/http/guards";
import { isKillSwitchActive } from "@/server/auth/killSwitch";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const started = Date.now();
    const [totalUsers, totalEvents, totalRegistrations, pendingApplications, recentLogs, killSwitchActive] =
      await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.event.count({ where: { archived: false } }),
        prisma.registration.count(),
        prisma.hostApplication.count({ where: { status: "PENDING" } }),
        prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            createdAt: true,
            actorId: true,
          },
        }),
        isKillSwitchActive(),
      ]);
    const dbLatencyMs = Date.now() - started;

    return jsonOk({
      telemetry: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        pendingApplications,
        dbPoolLatencyMs: dbLatencyMs,
        killSwitchActive,
      },
      auditLogs: recentLogs,
    });
  } catch (error) {
    return safeError(error, "Unable to fetch admin stats");
  }
}
