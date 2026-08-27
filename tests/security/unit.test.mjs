import assert from "node:assert/strict";
import test from "node:test";
import { isValidEventId, publicEvent } from "../../src/server/services/eventsPublic.js";
import { assertSameOrigin } from "../../src/server/http/csrf.js";
import { rateLimit } from "../../src/server/http/rateLimit.js";
import { hashPassword, validatePasswordPolicy, verifyPassword } from "../../src/server/utils/passwordUtils.js";
import { signTicketPayload, verifyTicketPayload } from "../../src/server/tickets/hmac.js";

process.env.TICKET_HMAC_SECRET = "a".repeat(48);
process.env.NEXTAUTH_SECRET = "b".repeat(48);
process.env.NEXTAUTH_URL = "http://localhost:3000";

test("event ids reject path traversal", () => {
  assert.equal(isValidEventId("ai-llm-summit"), true);
  assert.equal(isValidEventId("../etc/passwd"), false);
  assert.equal(isValidEventId("a/../../x"), false);
  assert.equal(isValidEventId(""), false);
});

test("publicEvent never includes creator email or attendee list", () => {
  const view = publicEvent(
    {
      id: "e1",
      title: "Fest",
      type: "Fest",
      category: "Fest",
      tags: JSON.stringify(["music"]),
      date: new Date(),
      location: "Hall",
      description: "Hi",
      ticketType: "Free",
      price: 10,
      capacity: 100,
      status: "Active",
      createdBy: { email: "secret@uncooked.edu", name: "Host", fullName: "Host" },
    },
    { registrationCount: 4 }
  );
  assert.equal(view.hostName, "Host");
  assert.equal(view.price, 0);
  assert.equal(view.spotsLeft, 96);
  assert.equal(view.createdBy, undefined);
  assert.ok(!JSON.stringify(view).includes("secret@uncooked.edu"));
});

test("HMAC rejects tampered ticket signatures", () => {
  const sig = signTicketPayload({ registrationId: "r1", eventId: "e1", userId: "u1" });
  assert.equal(verifyTicketPayload({ registrationId: "r1", eventId: "e1", userId: "u1", sig }), true);
  assert.equal(verifyTicketPayload({ registrationId: "r1", eventId: "e1", userId: "u2", sig }), false);
  assert.equal(verifyTicketPayload({ registrationId: "r1", eventId: "e1", userId: "u1", sig: sig.slice(0, 8) }), false);
});

test("CSRF blocks missing and foreign origins on POST", () => {
  const missing = new Request("http://localhost:3000/api/contact", { method: "POST" });
  assert.equal(assertSameOrigin(missing), "Missing Origin header");
  const evil = new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { origin: "https://evil.example" },
  });
  assert.equal(assertSameOrigin(evil), "Cross-origin request blocked");
  const ok = new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
  });
  assert.equal(assertSameOrigin(ok), null);
});

test("password policy rejects weak secrets", () => {
  assert.ok(validatePasswordPolicy("short"));
  assert.ok(validatePasswordPolicy("111111111111"));
  assert.equal(validatePasswordPolicy("CampusHost1234"), null);
});

test("scrypt hash verifies and rejects plaintext leftovers", async () => {
  const stored = await hashPassword("CampusHost1234");
  assert.equal(stored.includes("CampusHost1234"), false);
  assert.equal(await verifyPassword("CampusHost1234", stored), true);
  assert.equal(await verifyPassword("CampusHost1234", "CampusHost1234"), false);
  assert.equal(await verifyPassword("wrong-password-1", stored), false);
});

test("rate limiter trips after the window max", () => {
  const key = `unit-${Date.now()}`;
  assert.equal(rateLimit(key, 2, 60_000).ok, true);
  assert.equal(rateLimit(key, 2, 60_000).ok, true);
  assert.equal(rateLimit(key, 2, 60_000).ok, false);
});
