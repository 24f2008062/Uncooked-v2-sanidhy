/**
 * Validate public Supabase env before creating clients.
 * Truncated JWTs (2 segments) and dead project hosts fail closed with a clear error.
 */

export function getSupabasePublicConfig() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  return { url, anonKey, issues: validateSupabasePublicConfig(url, anonKey) };
}

export function validateSupabasePublicConfig(url, anonKey) {
  const issues = [];
  if (!url || url.includes("placeholder")) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder");
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") {
        issues.push("NEXT_PUBLIC_SUPABASE_URL must use https");
      }
      if (!parsed.hostname.endsWith(".supabase.co")) {
        issues.push("NEXT_PUBLIC_SUPABASE_URL host should be *.supabase.co");
      }
      if (parsed.hostname === "uncooked-dev-project.supabase.co") {
        issues.push(
          "NEXT_PUBLIC_SUPABASE_URL points at deleted/invalid project uncooked-dev-project; use the live project ref host"
        );
      }
    } catch {
      issues.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
    }
  }

  if (!anonKey || anonKey.includes("placeholder")) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or still a placeholder");
  } else {
    const parts = anonKey.split(".");
    // Legacy JWT anon keys are header.payload.signature (3 parts).
    // New sb_publishable_ keys are a single token without dots.
    const isLegacyJwt = parts.length === 3 && anonKey.startsWith("eyJ");
    const isPublishable = anonKey.startsWith("sb_publishable_");
    if (!isLegacyJwt && !isPublishable) {
      issues.push(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY looks truncated or invalid (expected 3-part JWT or sb_publishable_…)"
      );
    }
    if (isLegacyJwt && anonKey.length < 100) {
      issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is suspiciously short for a JWT anon key");
    }
  }

  return issues;
}

export function assertSupabasePublicConfig() {
  const { url, anonKey, issues } = getSupabasePublicConfig();
  if (issues.length) {
    const err = new Error(`Supabase Auth is misconfigured: ${issues.join("; ")}`);
    err.code = "SUPABASE_ENV_INVALID";
    throw err;
  }
  return { url, anonKey };
}

export function validateServiceRoleKey(key = process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const value = String(key || "").trim();
  if (!value) return ["SUPABASE_SERVICE_ROLE_KEY is missing"];
  const parts = value.split(".");
  const isLegacyJwt = parts.length === 3 && value.startsWith("eyJ");
  const isSecret = value.startsWith("sb_secret_");
  if (!isLegacyJwt && !isSecret) {
    return [
      "SUPABASE_SERVICE_ROLE_KEY looks truncated or invalid (expected 3-part JWT or sb_secret_…)",
    ];
  }
  if (isLegacyJwt && value.length < 100) {
    return ["SUPABASE_SERVICE_ROLE_KEY is suspiciously short for a JWT service role key"];
  }
  return [];
}
