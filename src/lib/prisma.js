import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "development") {
  console.warn("[Prisma] DATABASE_URL is not configured");
}

const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";
const useSsl = Boolean(
  connectionString.includes("supabase") ||
    connectionString.includes("pooler") ||
    connectionString.includes("sslmode=require") ||
    process.env.DATABASE_SSL === "true"
);

// Keep pools small on serverless (many isolates × max connections).
const poolMax = Number(process.env.DATABASE_POOL_MAX || (process.env.NODE_ENV === "production" ? 3 : 5));

const pool = new Pool({
  connectionString,
  max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
  ssl: useSsl ? { rejectUnauthorized } : undefined,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
