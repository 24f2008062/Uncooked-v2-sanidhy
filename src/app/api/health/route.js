import { NextResponse } from "next/server";
import { jsonOk, jsonError } from "@/server/http/envelope";
import prisma from "@/lib/prisma";
import { getSupabasePublicConfig, validateServiceRoleKey } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let database = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }

  const redisConfigured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
  const isProd = process.env.NODE_ENV === "production";
  const tlsBypass = process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0";
  const supabaseIssues = getSupabasePublicConfig().issues;
  const serviceIssues = validateServiceRoleKey();
  const authConfigured = supabaseIssues.length === 0 && serviceIssues.length === 0;

  // Public body stays minimal — only coarse dependency flags, no secrets/hostnames.
  const publicPayload = {
    status: database === "ok" && (!isProd || (redisConfigured && authConfigured)) ? "ok" : "degraded",
    database,
    auth: authConfigured ? "ok" : "misconfigured",
    email: emailConfigured ? "configured" : "missing",
    latencyMs: Date.now() - started,
    time: new Date().toISOString(),
  };

  if (database !== "ok") {
    return jsonError("Service temporarily unavailable", 503, "DEPENDENCY_UNAVAILABLE");
  }

  if (isProd && !redisConfigured) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_BACKEND_MISSING",
          message: "Shared rate limiting is required in production",
        },
        data: { status: "degraded", database: "ok", auth: publicPayload.auth },
      },
      { status: 503 }
    );
  }

  if (isProd && tlsBypass) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TLS_VERIFY_DISABLED",
          message: "TLS certificate verification must be enabled in production",
        },
        data: { status: "degraded", database: "ok", auth: publicPayload.auth },
      },
      { status: 503 }
    );
  }

  if (isProd && !authConfigured) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTH_MISCONFIGURED",
          message: "Supabase Auth environment is incomplete or invalid",
        },
        data: { status: "degraded", database: "ok", auth: "misconfigured" },
      },
      { status: 503 }
    );
  }

  if (isProd && !emailConfigured) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "EMAIL_PROVIDER_MISSING",
          message: "Transactional email provider is required in production",
        },
        data: {
          status: "degraded",
          database: "ok",
          auth: publicPayload.auth,
          email: "missing",
        },
      },
      { status: 503 }
    );
  }

  return jsonOk(publicPayload);
}
