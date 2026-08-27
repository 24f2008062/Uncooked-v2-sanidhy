import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const whereClause = {};

    if (type && type !== "All") {
      whereClause.type = { equals: type, mode: "insensitive" };
    }

    const opportunities = await prisma.opportunity.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ opportunities, count: opportunities.length });
  } catch (error) {
    console.error("Error fetching opportunities:", error.message || error);
    if (error.message?.includes("Can't reach database server") || error.code === "P1001") {
      return NextResponse.json(
        { error: "Database server connection failed. Please check DATABASE_URL in .env.local", opportunities: [], count: 0 },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch opportunities", opportunities: [], count: 0 },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, company, type, location, stipend, description } = body;

    if (!title || !company || !type || !description) {
      return NextResponse.json(
        { error: "Missing required fields (title, company, type, description)" },
        { status: 400 }
      );
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        title,
        company,
        type,
        location: location || "Remote",
        stipend: stipend || "Unpaid / Disclosed on interview",
        description,
      },
    });

    return NextResponse.json(
      { message: "Opportunity posted successfully", opportunity },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating opportunity:", error.message || error);
    if (error.message?.includes("Can't reach database server") || error.code === "P1001") {
      return NextResponse.json(
        { error: "Database server connection failed. Please check DATABASE_URL in .env.local" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}
