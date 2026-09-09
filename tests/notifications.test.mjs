import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeNotificationPayload } from "../src/server/services/notifications.js";

describe("notification payload sanitization", () => {
  it("requires title and body", () => {
    assert.throws(() => sanitizeNotificationPayload({ title: "", body: "x" }));
    assert.throws(() => sanitizeNotificationPayload({ title: "x", body: "" }));
  });

  it("truncates and accepts https media only", () => {
    const longTitle = "T".repeat(300);
    const out = sanitizeNotificationPayload({
      title: longTitle,
      body: "Hello team",
      mediaUrl: "https://images.unsplash.com/photo.jpg",
      kind: "announcement",
    });
    assert.equal(out.title.length, 200);
    assert.equal(out.body, "Hello team");
    assert.equal(out.kind, "ANNOUNCEMENT");
    assert.ok(out.mediaUrl.startsWith("https://"));
  });

  it("rejects non-https media urls", () => {
    const out = sanitizeNotificationPayload({
      title: "Hi",
      body: "Body",
      mediaUrl: "javascript:alert(1)",
    });
    assert.equal(out.mediaUrl, null);
  });
});
