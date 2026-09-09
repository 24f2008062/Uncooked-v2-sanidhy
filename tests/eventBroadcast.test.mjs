import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeBulletinPayload, isEventHost } from "../src/server/services/eventBroadcast.js";

describe("event broadcast sanitization", () => {
  it("requires title and content", () => {
    assert.throws(() => sanitizeBulletinPayload({ title: "", content: "x" }));
    assert.throws(() => sanitizeBulletinPayload({ title: "x", content: "" }));
  });

  it("truncates and strips bad media", () => {
    const out = sanitizeBulletinPayload({
      title: "T".repeat(250),
      content: "Hello attendees",
      mediaUrl: "javascript:alert(1)",
    });
    assert.equal(out.title.length, 200);
    assert.equal(out.content, "Hello attendees");
    assert.equal(out.mediaUrl, null);
  });
});

describe("event host check", () => {
  it("allows creator and super admin", () => {
    const event = { createdById: "u1" };
    assert.equal(isEventHost({ id: "u1", role: "USER" }, event), true);
    assert.equal(isEventHost({ id: "u2", role: "SUPER_ADMIN" }, event), true);
    assert.equal(isEventHost({ id: "u2", role: "USER" }, event), false);
  });
});
