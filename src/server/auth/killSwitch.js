import prisma from "@/lib/prisma";

const KEY = "kill_switch";

/**
 * Fail closed for write paths: if settings cannot be read, treat as paused.
 * `unavailable` distinguishes a real kill switch from a DB outage.
 */
export async function getKillSwitchState() {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: KEY } });
    return { active: row?.value === "true", unavailable: false };
  } catch {
    return { active: true, unavailable: true };
  }
}

export async function isKillSwitchActive() {
  const state = await getKillSwitchState();
  return state.active;
}

/** Read-only helper for dashboards. Does not fail closed on DB errors. */
export async function peekKillSwitchActive() {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: KEY } });
    return row?.value === "true";
  } catch {
    return false;
  }
}

export async function setKillSwitch({ active, reason, actorId }) {
  const value = active ? "true" : "false";
  return prisma.platformSetting.upsert({
    where: { key: KEY },
    update: {
      value,
      updatedBy: actorId || null,
    },
    create: {
      key: KEY,
      value,
      updatedBy: actorId || null,
    },
  });
}
