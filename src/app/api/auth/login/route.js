import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { enforceMutationGuards } from "@/server/http/guards";
import { jsonError, jsonOk, readJson } from "@/server/http/envelope";
import { isAccountBlocked } from "@/server/auth/authentication";
import { clearFailedLogins, recordFailedLogin } from "@/server/auth/loginLockout";
import { syncAuthAppMetadata } from "@/lib/supabase/admin";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

const GENERIC_FAIL = "Invalid email or password.";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_auth_login",
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (blocked) return blocked;

    const envIssues = getSupabasePublicConfig().issues;
    if (envIssues.length) {
      console.error("[AUTH_LOGIN] supabase env invalid:", envIssues.join("; "));
      return jsonError(
        "Sign-in is temporarily unavailable. Authentication is misconfigured.",
        503,
        "AUTH_MISCONFIGURED"
      );
    }

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;

    const email = String(parsed.body.email || "").toLowerCase().trim();
    const password = String(parsed.body.password || "");
    if (!email || !email.includes("@") || !password) {
      return jsonError(GENERIC_FAIL, 401, "INVALID_CREDENTIALS");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        authUserId: true,
        passwordHash: true,
        role: true,
        tokenVersion: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        disabledAt: true,
        deletedAt: true,
      },
    });

    if (user && isAccountBlocked(user)) {
      return jsonError(GENERIC_FAIL, 401, "INVALID_CREDENTIALS");
    }

    const supabase = await createClient();
    let data;
    let error;
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      data = result.data;
      error = result.error;
    } catch (networkErr) {
      console.error("[AUTH_LOGIN] supabase unreachable:", networkErr?.message || networkErr);
      return jsonError(
        "Sign-in is temporarily unavailable. Please try again shortly.",
        503,
        "AUTH_UPSTREAM_UNAVAILABLE"
      );
    }

    // JIT migrate legacy hash accounts, then retry once.
    if (error && user && !user.authUserId && user.passwordHash) {
      try {
        const migrateRes = await fetch(new URL("/api/auth/migrate-login", req.url), {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: req.headers.get("origin") || "",
            cookie: req.headers.get("cookie") || "",
          },
          body: JSON.stringify({ email, password }),
        });
        if (migrateRes.ok) {
          const retry = await supabase.auth.signInWithPassword({ email, password });
          data = retry.data;
          error = retry.error;
        }
      } catch (migrateErr) {
        console.warn("[AUTH_LOGIN] migrate fallback failed:", migrateErr.message);
      }
    }

    if (error || !data?.user) {
      if (user) {
        await recordFailedLogin(user.id);
      }
      return jsonError(GENERIC_FAIL, 401, "INVALID_CREDENTIALS");
    }

    // Resolve Prisma profile (may have been linked by migrate).
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ authUserId: data.user.id }, { email }],
      },
      select: {
        id: true,
        authUserId: true,
        role: true,
        tokenVersion: true,
        deletedAt: true,
        disabledAt: true,
        lockedUntil: true,
      },
    });

    if (!dbUser || isAccountBlocked(dbUser)) {
      await supabase.auth.signOut();
      return jsonError(GENERIC_FAIL, 401, "INVALID_CREDENTIALS");
    }

    dbUser = await clearFailedLogins(dbUser.id);

    try {
      await syncAuthAppMetadata(data.user.id, {
        role: dbUser.role || "USER",
        accountStatus: "ACTIVE",
        lockedUntil: null,
        tokenVersion: dbUser.tokenVersion || 0,
      });
      // Refresh so access token picks up app_metadata.token_version.
      await supabase.auth.refreshSession();
    } catch (syncErr) {
      console.error("[AUTH_LOGIN] claim sync failed:", syncErr.message);
    }

    return jsonOk({
      message: "Signed in",
      user: { id: dbUser.id, role: dbUser.role },
    });
  } catch (err) {
    console.error("[AUTH_LOGIN] unhandled:", err.message);
    return jsonError("Unable to sign in. Please try again.", 500, "INTERNAL_ERROR");
  }
}
