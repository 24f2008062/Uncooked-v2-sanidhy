import { scrypt, scryptSync, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
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
 * Verifies a plaintext password against stored hashes (scrypt, bcrypt, colon/dot separated, or legacy plaintext).
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

    // 2. Check if storedHash is separated by colon (:) or dot (.)
    const delimiter = storedHash.includes(":") ? ":" : storedHash.includes(".") ? "." : null;
    if (delimiter) {
      const parts = storedHash.split(delimiter);
      if (parts.length === 2) {
        let salt, expectedHash;
        // Determine which part is the 32-hex-char salt (16 bytes)
        if (parts[0].length === 32) {
          salt = parts[0];
          expectedHash = parts[1];
        } else if (parts[1].length === 32) {
          expectedHash = parts[0];
          salt = parts[1];
        } else {
          expectedHash = parts[0];
          salt = parts[1];
        }

        const expectedBuf = Buffer.from(expectedHash, "hex");

        // Try scrypt
        try {
          const scryptBuf = await scryptAsync(password, salt, expectedBuf.length);
          if (expectedBuf.length === scryptBuf.length && timingSafeEqual(expectedBuf, scryptBuf)) {
            return true;
          }
        } catch (err) {}

        // Try pbkdf2 with sha512
        try {
          const pbkdf2Buf = pbkdf2Sync(password, salt, 1000, expectedBuf.length, "sha512");
          if (expectedBuf.length === pbkdf2Buf.length && timingSafeEqual(expectedBuf, pbkdf2Buf)) {
            return true;
          }
        } catch (err) {}

        // Try pbkdf2 with sha256
        try {
          const pbkdf2Sha256Buf = pbkdf2Sync(password, salt, 1000, expectedBuf.length, "sha256");
          if (expectedBuf.length === pbkdf2Sha256Buf.length && timingSafeEqual(expectedBuf, pbkdf2Sha256Buf)) {
            return true;
          }
        } catch (err) {}
      }
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


