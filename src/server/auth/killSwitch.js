import prisma from "@/lib/prisma";

const KEY = "kill_switch";

export async function isKillSwitchActive() {
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
