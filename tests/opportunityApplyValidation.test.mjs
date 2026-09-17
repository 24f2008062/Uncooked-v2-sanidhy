import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Mirrors validation rules in src/app/api/opportunities/[id]/apply/route.js
 * so empty / http-only payloads fail closed with 400 semantics.
 */
function validateApplyBody(body = {}) {
  const coverNote = String(body.coverNote || body.note || "").trim().slice(0, 2000);
  const resumeUrl = String(body.resumeUrl || body.portfolio || "").trim().slice(0, 300);
  if (!coverNote && !resumeUrl) {
    return { ok: false, code: "VALIDATION_ERROR" };
  }
  if (resumeUrl && !/^https:\/\//i.test(resumeUrl)) {
    return { ok: false, code: "VALIDATION_ERROR" };
  }
  return { ok: true };
}

describe("opportunity apply validation", () => {
  it("rejects empty applications", () => {
    assert.equal(validateApplyBody({}).ok, false);
  });

  it("rejects http portfolio links", () => {
    const r = validateApplyBody({ resumeUrl: "http://example.com/cv" });
    assert.equal(r.ok, false);
  });

  it("accepts https portfolio or cover note", () => {
    assert.equal(validateApplyBody({ coverNote: "Interested" }).ok, true);
    assert.equal(validateApplyBody({ resumeUrl: "https://example.com/cv" }).ok, true);
  });
});
