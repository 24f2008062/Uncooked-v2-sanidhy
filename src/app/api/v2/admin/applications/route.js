import prisma from "@/lib/prisma";
import { jsonOk, safeError } from "@/server/http/envelope";
import { requireSuperAdmin } from "@/server/http/guards";

export async function GET(req) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";

    const applications = await prisma.hostApplication.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            name: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return jsonOk({ applications });
  } catch (error) {
    return safeError(error, "Unable to fetch host applications");
  }
}
