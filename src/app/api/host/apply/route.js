import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, organizationName, organizationType, notes, documentUrls } = body;

    if (!userId || !organizationName || !organizationType) {
      return NextResponse.json(
        { error: "User ID, organization name, and organization type are required" },
        { status: 400 }
      );
    }

    const application = await prisma.hostApplication.upsert({
      where: { userId },
      update: {
        organizationName,
        organizationType,
        notes: notes || null,
        documentUrls: documentUrls ? JSON.stringify(documentUrls) : null,
        status: "PENDING",
      },
      create: {
        userId,
        organizationName,
        organizationType,
        notes: notes || null,
        documentUrls: documentUrls ? JSON.stringify(documentUrls) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Host application submitted successfully. Pending administrator review.",
        applicationId: application.id,
        status: application.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Host application error:", error);
    return NextResponse.json(
      { error: "Failed to submit host application" },
      { status: 500 }
    );
  }
}
