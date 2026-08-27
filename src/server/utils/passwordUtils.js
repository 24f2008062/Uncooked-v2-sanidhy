import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Hashes a plaintext password using crypto.scrypt and a random 16-byte hex salt.
 * @param {string} password - The plaintext password to hash.
 * @returns {Promise<string>} The formatted hash string ("hash.salt").
 */
export async function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Verifies a plaintext password against a stored "hash.salt" string using timingSafeEqual.
 * @param {string} password - Plaintext password input.
 * @param {string} storedHash - Stored "hash.salt" string.
 * @returns {Promise<boolean>} True if password matches, false otherwise.
 */
export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.includes(".")) {
    return false;
  }
  try {
    const [hashedPassword, salt] = storedHash.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = await scryptAsync(password, salt, 64);
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  } catch (error) {
    return false;
  }
}
