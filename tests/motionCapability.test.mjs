import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPrefersReducedMotion,
  getIsDesktopViewport,
  getNetworkAllowsHeavyFx,
  getShouldEnableWebGL,
} from "../src/lib/motionCapability.js";

describe("motionCapability SSR-safe defaults", () => {
  it("returns false without window", () => {
    assert.equal(getPrefersReducedMotion(), false);
    assert.equal(getIsDesktopViewport(), false);
    assert.equal(getNetworkAllowsHeavyFx(), false);
    assert.equal(getShouldEnableWebGL(), false);
    assert.equal(getShouldEnableWebGL(768, { allowMobile: true }), false);
  });
});
