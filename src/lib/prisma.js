import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "development") {
  console.warn("[Prisma] DATABASE_URL is not configured");
}

const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";
const useSsl = Boolean(
  connectionString &&
    (connectionString.includes("supabase") ||
      connectionString.includes("pooler") ||
      connectionString.includes("sslmode=require") ||
      process.env.DATABASE_SSL === "true")
);

const pool = connectionString
  ? new Pool({
      connectionString,
      max: 5,
      ssl: useSsl ? { rejectUnauthorized } : undefined,
    })
  : null;

const adapter = pool ? new PrismaPg(pool) : undefined;

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(adapter ? { adapter } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
