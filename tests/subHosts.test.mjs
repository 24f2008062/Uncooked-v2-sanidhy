import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEventHostAccess } from "../src/server/auth/eventHost.js";

describe("Sub-Host Delegation & Authorization Invariants", () => {
  it("Unauthenticated user receives no host access", async () => {
    const access = await getEventHostAccess("event-123", null);
    assert.equal(access.allowed, false);
    assert.equal(access.isHost, false);
    assert.equal(access.isCreator, false);
    assert.equal(access.isSubHost, false);
  });

  it("Super admin is granted full creator host access", async () => {
    const adminUser = { id: "admin-1", role: "SUPER_ADMIN" };
    const access = await getEventHostAccess("event-123", adminUser);
    assert.equal(access.allowed, true);
    assert.equal(access.isHost, true);
    assert.equal(access.isCreator, true);
    assert.equal(access.isSubHost, false);
    assert.equal(access.role, "SUPER_ADMIN");
  });

  it("Event creator is recognized as primary host", async () => {
    const creatorUser = { id: "host-user-1", role: "ORGANIZER" };
    const event = { id: "event-123", createdById: "host-user-1" };
    const access = await getEventHostAccess(event, creatorUser);
    assert.equal(access.allowed, true);
    assert.equal(access.isHost, true);
    assert.equal(access.isCreator, true);
    assert.equal(access.isSubHost, false);
    assert.equal(access.role, "CREATOR");
  });

  it("Assigned sub-host in preloaded relation is recognized with SUB_HOST role", async () => {
    const staffUser = { id: "staff-user-2", role: "USER" };
    const event = {
      id: "event-123",
      createdById: "host-user-1",
      subHosts: [{ userId: "staff-user-2", role: "CHECKIN_STAFF" }],
    };
    const access = await getEventHostAccess(event, staffUser);
    assert.equal(access.allowed, true);
    assert.equal(access.isHost, true);
    assert.equal(access.isCreator, false);
    assert.equal(access.isSubHost, true);
    assert.equal(access.role, "CHECKIN_STAFF");
  });

  it("Non-host attendee is denied host and staff privileges", async () => {
    const guestUser = { id: "guest-user-3", role: "USER" };
    const event = {
      id: "event-123",
      createdById: "host-user-1",
      subHosts: [{ userId: "staff-user-2", role: "SUB_HOST" }],
    };
    const access = await getEventHostAccess(event, guestUser);
    assert.equal(access.allowed, false);
    assert.equal(access.isHost, false);
    assert.equal(access.isCreator, false);
    assert.equal(access.isSubHost, false);
  });
});

