import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards } from "@/server/http/guards";
import { getClientIp, hashIp } from "@/server/http/ip";
import { sendContactNotification } from "@/lib/email/service";

const CATEGORIES = new Set([
  "Host Verification",
  "Event Ticketing",
  "Campus Partnership",
  "Technical Support",
  "General Inquiry",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_contact",
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (blocked) return blocked;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const name = String(body.name || "").trim().slice(0, 80);
    const email = String(body.email || "").toLowerCase().trim();
    const category = CATEGORIES.has(body.category) ? body.category : "General Inquiry";
    const message = String(body.message || "").trim().slice(0, 4000);

    if (!name || !EMAIL_RE.test(email) || !message) {
      return jsonError("Name, valid email, and message are required", 400);
    }

    await prisma.contactMessage.create({
      data: {
        name,
        email,
        category,
        message,
        ipHash: hashIp(getClientIp(req)),
      },
    });

    // Dispatch email notification to support team and auto-reply to user
    await sendContactNotification({
      name,
      email,
      category,
      message,
    });

    return jsonOk({
      message: "Your message has been received. We will respond to the email you provided.",
    }, 201);
  } catch (error) {
    return safeError(error, "Unable to send message");
  }
}
