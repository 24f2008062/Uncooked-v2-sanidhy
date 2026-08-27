import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { PASSWORD_MIN_LENGTH } from "@/server/config/legal";

const scryptAsync = promisify(scrypt);
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function validatePasswordPolicy(password) {
  if (!password || typeof password !== "string") {
    return "Password is required";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > 128) {
    return "Password is too long";
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Password must include a letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number";
  }
  return null;
}

export async function hashPassword(password) {
  const policyError = validatePasswordPolicy(password);
  if (policyError) {
    throw new Error(policyError);
  }
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64, SCRYPT_OPTIONS);
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== "string") {
    return false;
  }

  // Reject legacy plaintext or unknown formats. Only scrypt "hash.salt" is accepted.
  const parts = storedHash.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [hashHex, salt] = parts;
  if (!hashHex || !salt || salt.length !== 32 || hashHex.length % 2 !== 0) {
    return false;
  }

  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = await scryptAsync(password, salt, expected.length, SCRYPT_OPTIONS);
    if (expected.length !== actual.length) {
      return false;
    }
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
