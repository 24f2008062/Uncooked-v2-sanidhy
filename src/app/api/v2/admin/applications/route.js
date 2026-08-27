import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/authentication";
import { hasPermission } from "@/server/auth/authorization";

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && !hasPermission(user, "HOSTS_AUDIT")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("GET /api/v2/admin/applications error:", error.message || error);
    return NextResponse.json({ error: "Failed to fetch host applications" }, { status: 500 });
  }
}
