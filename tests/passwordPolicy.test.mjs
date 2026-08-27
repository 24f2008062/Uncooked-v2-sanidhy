import assert from "node:assert/strict";
import test from "node:test";

function validatePasswordPolicy(password) {
  if (!password || typeof password !== "string") return "Password is required";
  if (password.length < 12) return "Password must be at least 12 characters";
  if (password.length > 128) return "Password is too long";
  if (!/[A-Za-z]/.test(password)) return "Password must include a letter";
  if (!/[0-9]/.test(password)) return "Password must include a number";
  return null;
}

test("rejects short passwords", () => {
  assert.equal(validatePasswordPolicy("Abc123"), "Password must be at least 12 characters");
});

test("rejects passwords without numbers", () => {
  assert.equal(validatePasswordPolicy("abcdefghijkl"), "Password must include a number");
});

test("accepts a policy-compliant password", () => {
  assert.equal(validatePasswordPolicy("CampusHost123"), null);
});
