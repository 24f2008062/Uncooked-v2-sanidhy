import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hardenSupabaseCookieOptions } from "../src/server/config/authCookies.js";

describe("hardenSupabaseCookieOptions", () => {
  it("defaults path/sameSite and respects browser readable httpOnly for SSR", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL;
    const opts = hardenSupabaseCookieOptions({ maxAge: 100 });
    assert.equal(opts.httpOnly, false);
    assert.equal(opts.path, "/");
    assert.equal(opts.sameSite, "lax");
    assert.equal(opts.maxAge, 100);
    assert.equal(opts.secure, false);
    process.env.NODE_ENV = prev;
  });

  it("forces Secure on Vercel/production without blocking client reader", () => {
    const prevNode = process.env.NODE_ENV;
    const prevVercel = process.env.VERCEL;
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";
    const opts = hardenSupabaseCookieOptions({ httpOnly: false, secure: false });
    assert.equal(opts.httpOnly, false);
    assert.equal(opts.secure, true);
    process.env.NODE_ENV = prevNode;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
  });
});
