import prisma from "@/lib/prisma";
import { jsonOk, safeError } from "@/server/http/envelope";
import { requireSuperAdmin } from "@/server/http/guards";
import { peekKillSwitchActive } from "@/server/auth/killSwitch";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const started = Date.now();
    const [
      totalUsers,
      totalEvents,
      totalRegistrations,
      pendingApplications,
      totalOpportunities,
      recentEvents,
      recentOpportunities,
      recentLogs,
      killSwitchActive
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.event.count({ where: { archived: false } }),
      prisma.registration.count(),
      prisma.hostApplication.count({ where: { status: "PENDING" } }),
      prisma.opportunity.count(),
      prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          type: true,
          status: true,
          date: true,
          location: true,
          bannerUrl: true,
          capacity: true,
          _count: { select: { registrations: true } },
        },
      }),
      prisma.opportunity.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          company: true,
          type: true,
          status: true,
          stipend: true,
          location: true,
          _count: { select: { applications: true } },
        },
      }),
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
      peekKillSwitchActive(),
    ]);
    const dbLatencyMs = Date.now() - started;

    return jsonOk({
      telemetry: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        pendingApplications,
        totalOpportunities,
        dbPoolLatencyMs: dbLatencyMs,
        killSwitchActive,
      },
      recentEvents,
      recentOpportunities,
      auditLogs: recentLogs,
    });
  } catch (error) {
    return safeError(error, "Unable to fetch admin stats");
  }
}
