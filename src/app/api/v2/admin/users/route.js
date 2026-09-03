import prisma from "@/lib/prisma";
import { jsonOk, safeError } from "@/server/http/envelope";
import { requireSuperAdmin } from "@/server/http/guards";

export async function GET(req) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").slice(0, 80);
    const role = searchParams.get("role") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const validSortFields = ["createdAt", "fullName", "email", "role", "department"];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(role ? { role } : {}),
        ...(search
          ? {
              OR: [
                { email: { contains: search, mode: "insensitive" } },
                { fullName: { contains: search, mode: "insensitive" } },
                { department: { contains: search, mode: "insensitive" } },
                { clubAssociation: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        name: true,
        email: true,
        role: true,
        department: true,
        clubAssociation: true,
        phoneE164: true,
        interests: true,
        emailVerified: true,
        onboardingCompleted: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        disabledAt: true,
        disabledReason: true,
        lastLoginAt: true,
        createdAt: true,
        authUserId: true,
      },
      orderBy: { [orderField]: sortOrder },
      take: 100,
    });

    return jsonOk({ users });
  } catch (error) {
    return safeError(error, "Unable to fetch users");
  }
}
