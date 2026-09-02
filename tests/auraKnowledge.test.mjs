import assert from "node:assert/strict";
import test from "node:test";
import { getAuraReply, normalizeAuraQuery } from "../src/components/ui/auraKnowledge.js";

test("normalizeAuraQuery collapses whitespace", () => {
  assert.equal(normalizeAuraQuery("  Find   Events  "), "find events");
});

test("aura never invents campus scale or voice calls", () => {
  const host = getAuraReply("How do I host an event?");
  assert.match(host, /\/host\/apply/);
  assert.equal(/120\+|100\+ scans|voice call|offline caching|pci/i.test(host), false);

  const pass = getAuraReply("How do I get a pass?");
  assert.match(pass, /\/dashboard|HMAC|register/i);
  assert.equal(/apple\/google wallet|native scanner app/i.test(pass), false);

  const call = getAuraReply("Can you call me?");
  assert.match(call, /cannot place voice calls|contact/i);
});

test("aura routes privacy and opportunities correctly", () => {
  assert.match(getAuraReply("Account & privacy"), /\/profile|\/dashboard|erase/i);
  assert.match(getAuraReply("opportunities"), /\/opportunities/);
  assert.match(getAuraReply("security csrf"), /password|\/security|\/contact/i);
});
