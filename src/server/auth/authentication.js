import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const PUBLIC_USER_SELECT = {
  id: true,
  role: true,
  permissions: true,
  name: true,
  fullName: true,
  email: true,
  emailVerified: true,
  department: true,
  clubAssociation: true,
  interests: true,
  onboardingCompleted: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  tokenVersion: true,
  ageAttested18: true,
  termsAcceptedAt: true,
  privacyAcceptedAt: true,
  disabledAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
};

export function isAccountBlocked(user) {
  if (!user) return true;
  if (user.deletedAt) return true;
  if (user.disabledAt) return true;
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return true;
  return false;
}

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findFirst({
      where: session.user.id
        ? { id: session.user.id }
        : { email: session.user.email.toLowerCase().trim() },
      select: PUBLIC_USER_SELECT,
    });

    if (!user) return null;
    if (isAccountBlocked(user)) return null;

    const sessionVer = Number(session.user.ver ?? 0);
    if (sessionVer !== Number(user.tokenVersion || 0)) {
      return null;
    }

    return user;
  } catch (err) {
    console.error("[getCurrentUser] session resolve failed");
    return null;
  }
}
