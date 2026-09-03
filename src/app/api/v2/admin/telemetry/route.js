import prisma from "@/lib/prisma";
import { jsonOk, safeError } from "@/server/http/envelope";
import { requireSuperAdmin } from "@/server/http/guards";

export async function GET(req) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const rawWindow = searchParams.get("windowMinutes");
    const rawLimit = searchParams.get("limit");

    const parsedWindow = parseInt(rawWindow, 10);
    const parsedLimit = parseInt(rawLimit, 10);

    const windowMinutes = Math.min(Math.max(Number.isNaN(parsedWindow) ? 60 : parsedWindow, 5), 1440);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 1), 500);

    const sinceDate = new Date(Date.now() - windowMinutes * 60 * 1000);

    const snapshots = await prisma.systemTelemetrySnapshot.findMany({
      where: {
        timestamp: {
          gte: sinceDate,
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return jsonOk({
      snapshots,
      query: {
        windowMinutes,
        limit,
        since: sinceDate.toISOString(),
      },
    });
  } catch (error) {
    return safeError(error, "Failed to retrieve telemetry snapshots");
  }
}
