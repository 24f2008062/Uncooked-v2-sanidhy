import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/prisma";

export function hashToken(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function issueToken(identifier, purpose, ttlMs) {
  const raw = randomBytes(32).toString("base64url");
  const token = hashToken(raw);
  await prisma.verificationToken.deleteMany({ where: { identifier, purpose } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      purpose,
      expires: new Date(Date.now() + ttlMs),
    },
  });
  return raw;
}

export async function consumeToken(identifier, raw, purpose) {
  const token = hashToken(raw);
  const row = await prisma.verificationToken.findFirst({
    where: { identifier, token, purpose },
  });
  if (!row || row.expires < new Date()) {
    return false;
  }
  await prisma.verificationToken.deleteMany({ where: { identifier, purpose } });
  return true;
}
