import { config } from "dotenv";
config({ path: ".env.local" });
config();

import prisma from "../src/lib/prisma.js";
import {
  assertEventBroadcastAccess,
  createEventBroadcast,
  listEventBroadcasts,
  listEventAttendeeUserIds,
} from "../src/server/services/eventBroadcast.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  let event = await prisma.event.findFirst({
    where: { archived: false, status: { not: "Suspended" }, createdById: { not: null } },
    select: { id: true, title: true, createdById: true },
  });

  let host = event
    ? await prisma.user.findUnique({
        where: { id: event.createdById },
        select: { id: true, role: true },
      })
    : null;

  let createdTemp = false;
  if (!event || !host) {
    host = await prisma.user.findFirst({
      where: { deletedAt: null },
      select: { id: true, role: true },
    });
    assert(host, "need a user to act as host");
    const id = `ev-e2e-${Date.now()}`;
    event = await prisma.event.create({
      data: {
        id,
        title: "E2E Broadcast Event",
        type: "Meetup",
        date: new Date(Date.now() + 86400000),
        location: "Test Hall",
        description: "Temporary event for broadcast e2e",
        capacity: 50,
        createdById: host.id,
        status: "Active",
      },
      select: { id: true, title: true, createdById: true },
    });
    createdTemp = true;
  }

  const outsider = await prisma.user.findFirst({
    where: {
      id: { not: host.id },
      deletedAt: null,
      role: { notIn: ["SUPER_ADMIN", "super_admin"] },
      registrations: { none: { eventId: event.id } },
    },
    select: { id: true, role: true },
  });

  const accessHost = await assertEventBroadcastAccess(host, event.id, { write: true });
  assert(accessHost.canWrite, "host can write");

  if (outsider) {
    let denied = false;
    try {
      await assertEventBroadcastAccess(outsider, event.id, { write: false });
    } catch (e) {
      denied = e.status === 404;
    }
    assert(denied, "non-member read denied");
  }

  const post = await createEventBroadcast({
    eventId: event.id,
    authorId: host.id,
    title: `E2E Bulletin ${Date.now()}`,
    content: "Test broadcast to event attendees only.",
  });
  assert(post?.id, "bulletin created");

  const list = await listEventBroadcasts(event.id, { limit: 10 });
  assert(list.some((b) => b.id === post.id), "bulletin listed");

  const attendees = await listEventAttendeeUserIds(event.id, { excludeUserId: host.id });
  console.log({ event: event.id, attendees: attendees.length, bulletin: post.id });

  await prisma.bulletinUpdate.delete({ where: { id: post.id } });
  if (createdTemp) {
    await prisma.event.delete({ where: { id: event.id } }).catch(() => {});
  }
  console.log("PASS event broadcast e2e");
}

main()
  .catch((e) => {
    console.error("FAIL", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect().catch(() => {}));
