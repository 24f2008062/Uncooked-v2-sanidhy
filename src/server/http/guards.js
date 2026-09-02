import { getCurrentUser, getAuthUserAndProfile } from "@/server/auth/authentication";
import { isSuperAdmin } from "@/server/auth/authorization";
import { getKillSwitchState } from "@/server/auth/killSwitch";
import { assertSameOrigin } from "@/server/http/csrf";
import { jsonError } from "@/server/http/envelope";
import { getClientIp, hashIp } from "@/server/http/ip";
import { rateLimitAsync, rateLimitHeaders } from "@/server/http/rateLimit";

export async function enforceMutationGuards(req, { rateKey, limit = 30, windowMs = 60_000, skipKillSwitch = false } = {}) {
  const csrfError = assertSameOrigin(req);
  if (csrfError) {
    return jsonError(csrfError, 403, "FORBIDDEN");
  }

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const result = await rateLimitAsync(`${rateKey}:${ipHash}`, limit, windowMs);
  if (!result.ok) {
    return jsonError("Too many requests. Please try again later.", 429, "RATE_LIMITED", rateLimitHeaders(result));
  }

  if (!skipKillSwitch) {
    const kill = await getKillSwitchState();
    if (kill.active) {
      if (kill.unavailable) {
        return jsonError("Service temporarily unavailable", 503, "DEPENDENCY_UNAVAILABLE");
      }
      return jsonError("The platform is temporarily paused for maintenance.", 503, "KILL_SWITCH");
    }
  }

  return null;
}

export async function requireUser() {
  const { authUser, user, state } = await getAuthUserAndProfile();
  if (state === "NO_SUPABASE_SESSION") {
    return { error: jsonError("Please sign in to continue.", 401, "UNAUTHENTICATED") };
  }
  if (state === "AUTHENTICATED_BUT_PROFILE_MISSING") {
    return { error: jsonError("Application profile missing or incomplete.", 409, "PROFILE_NOT_PROVISIONED") };
  }
  if (state === "ACCOUNT_BLOCKED" || !user) {
    return { error: jsonError("Account is locked or disabled.", 403, "ACCOUNT_BLOCKED") };
  }
  return { user, authUser };
}

export async function requireRoles(roles = []) {
  const result = await requireUser();
  if (result.error) return result;
  if (isSuperAdmin(result.user)) return result;
  const allowed = roles.map((r) => String(r).toUpperCase());
  if (!allowed.includes(String(result.user.role).toUpperCase())) {
    return { error: jsonError("You do not have access to this action.", 403, "FORBIDDEN") };
  }
  return result;
}

export async function requireSuperAdmin() {
  const result = await requireUser();
  if (result.error) return result;
  if (!isSuperAdmin(result.user)) {
    return { error: jsonError("Administrator access required.", 403, "FORBIDDEN") };
  }
  return result;
}
