import { NextResponse } from "next/server";

export function jsonOk(data, status = 200, headers = {}) {
  return NextResponse.json({ success: true, data }, { status, headers });
}

export function jsonError(message, status = 400, code = "VALIDATION_ERROR", headers = {}) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status, headers }
  );
}

export function safeError(error, fallback = "Request failed") {
  const code = String(error?.code || "");
  const name = String(error?.name || "");
  const msg = String(error?.message || "");
  console.error("[api]", code || name || "ERR");
  // Fire-and-forget telemetry (no-op without SENTRY_DSN)
  import("@/server/observability/sentry")
    .then((m) => m.captureException(error, { code, name }))
    .catch(() => {});
  if (
    name.includes("PrismaClientInitialization") ||
    name.includes("PrismaClientRustPanic") ||
    code === "ECONNREFUSED" ||
    code === "P1001" ||
    code === "P1000" ||
    code === "P1002" ||
    code === "P1017" ||
    /ECONNREFUSED|ENOTFOUND|Can't reach database|connection/i.test(`${code} ${msg}`)
  ) {
    return jsonError("Service temporarily unavailable", 503, "DEPENDENCY_UNAVAILABLE");
  }
  if (code === "P2002") {
    return jsonError("This record already exists", 409, "CONFLICT");
  }
  return jsonError(fallback, 500, "INTERNAL_ERROR");
}

export async function readJson(req) {
  try {
    const body = await req.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return { error: jsonError("Invalid JSON body", 400) };
    }
    return { body };
  } catch {
    return { error: jsonError("Invalid JSON body", 400) };
  }
}
