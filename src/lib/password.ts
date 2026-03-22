import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Hash a plaintext password using bcrypt.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Enforce password policy. Throws if the password does not meet requirements.
 * - Minimum 8 characters
 * - At least one letter and one number
 */
export function assertPasswordPolicy(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    );
  }
  if (!/[a-zA-Z]/.test(password)) {
    throw new Error("Password must contain at least one letter.");
  }
  if (!/[0-9]/.test(password)) {
    throw new Error("Password must contain at least one number.");
  }
}
