import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";

function safeUser(user) {
  if (!user) return null;
  const {
    passwordHash,
    tokenVersion,
    lastLoginIpHash,
    failedLoginAttempts,
    lockedUntil,
    disabledAt,
    disabledReason,
    ...rest
  } = user;
  void passwordHash;
  void tokenVersion;
  void lastLoginIpHash;
  void failedLoginAttempts;
  void lockedUntil;
  void disabledAt;
  void disabledReason;
  return rest;
}

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: {
        registrations: {
          include: { event: true, ticketTier: true },
          orderBy: { registeredAt: "desc" },
        },
        hostApplication: true,
        opportunityApps: {
          include: { opportunity: true },
          orderBy: { appliedAt: "desc" },
        },
        consents: { orderBy: { acceptedAt: "desc" } },
      },
    });

    if (!user || user.deletedAt) {
      return jsonError("User profile not found", 404, "NOT_FOUND");
    }

    return jsonOk({ user: safeUser(user) });
  } catch (error) {
    return safeError(error, "Unable to load profile");
  }
}

export async function PUT(req) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_profile", limit: 20, windowMs: 60 * 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const fullName = body.fullName !== undefined ? String(body.fullName || "").trim().slice(0, 80) : undefined;
    const name = body.name !== undefined ? String(body.name || "").trim().slice(0, 80) : undefined;
    const department = body.department !== undefined ? String(body.department || "").trim().slice(0, 120) : undefined;
    const clubAssociation = body.clubAssociation !== undefined ? String(body.clubAssociation || "").trim().slice(0, 120) : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(name !== undefined && { name }),
        ...(department !== undefined && { department: department || null }),
        ...(clubAssociation !== undefined && { clubAssociation: clubAssociation || null }),
        ...(body.interests !== undefined && {
          interests: Array.isArray(body.interests)
            ? JSON.stringify(body.interests.slice(0, 20).map((i) => String(i).slice(0, 40)))
            : null,
        }),
      },
    });

    return jsonOk({
      message: "Profile updated",
      user: safeUser(updatedUser),
    });
  } catch (error) {
    return safeError(error, "Unable to update profile");
  }
}
