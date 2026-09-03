import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSupportTicketNotification } from "@/lib/email/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }

    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("[Admin Support API] Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }

    const { ticketId, message, status } = await req.json();

    if (!ticketId || (!message && !status)) {
      return NextResponse.json({ error: "Ticket ID and message or status update required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    }

    // Add message if provided
    if (message) {
      await prisma.ticketMessage.create({
        data: {
          ticketId,
          senderId: user.id,
          senderType: "STAFF",
          content: message,
        },
      });

      // Send email notification to user
      if (ticket.user?.email) {
        await sendSupportTicketNotification({
          to: ticket.user.email,
          ticketId: ticket.id,
          subject: ticket.subject,
          category: ticket.category,
          message,
          senderName: user.user_metadata?.name || "Support Team",
          isReply: true,
        });
      }
    }

    // Update status if provided
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(status ? { status } : {}),
        updatedAt: new Date(),
      },
      include: {
        user: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("[Admin Support API] Error processing support action:", error);
    return NextResponse.json({ error: "Failed to process support response" }, { status: 500 });
  }
}
