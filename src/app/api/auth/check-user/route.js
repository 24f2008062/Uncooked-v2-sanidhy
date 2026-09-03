import prisma from "@/lib/prisma";
import { jsonOk, jsonError, readJson } from "@/server/http/envelope";

export async function POST(req) {
  try {
    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;

    const email = String(parsed.body.email || "").toLowerCase().trim();
    if (!email || !email.includes("@")) {
      return jsonError("Invalid email parameter", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return jsonOk({ exists: !!user });
  } catch (err) {
    return jsonOk({ exists: false });
  }
}
