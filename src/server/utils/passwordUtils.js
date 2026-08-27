import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcryptjs";

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
 * Verifies a plaintext password against stored hashes (scrypt, bcrypt, or legacy plaintext).
 * @param {string} password - Plaintext password input.
 * @param {string} storedHash - Stored hash string.
 * @returns {Promise<boolean>} True if password matches, false otherwise.
 */
export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }
  try {
    // 1. Check if storedHash is bcrypt ($2a$, $2b$, $2y$)
    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
      return await bcrypt.compare(password, storedHash);
    }

    // 2. Check if storedHash is scrypt ("hash.salt")
    if (storedHash.includes(".")) {
      const [hashedPassword, salt] = storedHash.split(".");
      const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
      const suppliedPasswordBuf = await scryptAsync(password, salt, 64);
      return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
    }

    // 3. Fallback direct comparison (for legacy un-hashed dev credentials)
    if (password === storedHash) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("verifyPassword verification error:", error.message || error);
    return false;
  }
}

