import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/authentication";

export async function GET(req) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        registrations: {
          include: {
            event: true,
            ticketTier: true,
          },
          orderBy: { registeredAt: "desc" },
        },
        hostApplication: true,
        opportunityApps: {
          include: {
            opportunity: true,
          },
          orderBy: { appliedAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Strip sensitive fields
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("GET /api/user/profile error:", error.message || error);
    return NextResponse.json(
      { error: "Internal server error fetching user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, name, department, clubAssociation, interests } = body;

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        ...(fullName !== undefined && { fullName: fullName?.trim() }),
        ...(name !== undefined && { name: name?.trim() }),
        ...(department !== undefined && { department: department?.trim() }),
        ...(clubAssociation !== undefined && { clubAssociation: clubAssociation?.trim() }),
        ...(interests !== undefined && {
          interests: Array.isArray(interests) ? JSON.stringify(interests) : interests,
        }),
      },
    });

    const { passwordHash, ...safeUser } = updatedUser;

    return NextResponse.json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("PUT /api/user/profile error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
