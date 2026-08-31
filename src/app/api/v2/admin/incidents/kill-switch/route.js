import { jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireSuperAdmin } from "@/server/http/guards";
import { isKillSwitchActive, setKillSwitch } from "@/server/auth/killSwitch";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    return jsonOk({ killSwitchActive: await isKillSwitchActive() });
  } catch (error) {
    return safeError(error, "Unable to read kill-switch");
  }
}

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_admin_kill",
      limit: 10,
      windowMs: 60 * 1000,
      skipKillSwitch: true,
    });
    if (blocked) return blocked;

    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const active = Boolean(body.active);
    const reason = String(body.reason || "Administrative incident override").slice(0, 300);

    await setKillSwitch({ active, reason, actorId: auth.user.id });

    await logAuditEvent({
      action: "KILL_SWITCH_TOGGLE",
      actorId: auth.user.id,
      entityType: "PlatformSetting",
      entityId: "kill_switch",
      ipHash: hashIp(getClientIp(req)),
      metadata: { killSwitchActive: active, reason },
    });

    return jsonOk({
      message: `Emergency write-pause ${active ? "ACTIVATED" : "DEACTIVATED"}`,
      killSwitchActive: active,
    });
  } catch (error) {
    return safeError(error, "Unable to update kill-switch");
  }
}
