import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.NEWSLETTER_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("NEWSLETTER_ENCRYPTION_KEY is not set");
  }

  // Prefer 64-char hex (32 bytes). Also accept base64 of 32 bytes.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const fromBase64 = Buffer.from(raw, "base64");
  if (fromBase64.length === 32) {
    return fromBase64;
  }

  throw new Error(
    "NEWSLETTER_ENCRYPTION_KEY must be 64 hex characters (32 bytes) or base64 of 32 bytes",
  );
}

/** Deterministic lookup key — never store the plaintext email. */
export function hashEmail(email: string): string {
  const key = getEncryptionKey();
  return createHmac("sha256", key).update(`email-index:${email}`).digest("hex");
}

/** Encrypt an email for storage (AES-256-GCM). */
export function encryptEmail(email: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(email, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/** Decrypt a stored email ciphertext. */
export function decryptEmail(payload: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted email payload");
  }

  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}
