import assert from "node:assert/strict";
import test from "node:test";
import { signTicketPayload, verifyTicketPayload } from "../src/server/tickets/hmac.js";

process.env.TICKET_HMAC_SECRET = "c".repeat(48);
process.env.NEXTAUTH_SECRET = "d".repeat(48);

test("check-in HMAC accepts owner tuple and rejects swaps", () => {
  const base = { registrationId: "reg-1", eventId: "fest-2026", userId: "user-9" };
  const sig = signTicketPayload(base);
  assert.equal(verifyTicketPayload({ ...base, sig }), true);
  assert.equal(verifyTicketPayload({ ...base, userId: "other", sig }), false);
  assert.equal(verifyTicketPayload({ ...base, eventId: "other-event", sig }), false);
  assert.equal(verifyTicketPayload({ ...base, registrationId: "reg-2", sig }), false);
});
