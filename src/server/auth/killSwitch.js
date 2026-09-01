import prisma from "@/lib/prisma";

const KEY = "kill_switch";

export async function isKillSwitchActive() {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: KEY } });
    return row?.value === "true";
  } catch {
    // Fail closed for write-path callers: if we cannot read settings, treat
    // the platform as paused rather than allowing mutations during an outage.
    return true;
  }
}

/** Read-only helper for dashboards — does not fail closed on DB errors. */
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
