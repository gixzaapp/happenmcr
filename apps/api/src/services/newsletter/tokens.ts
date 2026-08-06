import { createHmac, timingSafeEqual } from "node:crypto";

function getTokenSecret(): string {
  const secret =
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.NEWSLETTER_ENCRYPTION_KEY?.trim();
  if (!secret) {
    throw new Error(
      "NEWSLETTER_UNSUBSCRIBE_SECRET or NEWSLETTER_ENCRYPTION_KEY is required",
    );
  }
  return secret;
}

function sign(emailHash: string): string {
  return createHmac("sha256", getTokenSecret())
    .update(`unsubscribe:${emailHash}`)
    .digest("base64url");
}

/** Opaque unsubscribe token tied to the subscriber hash. */
export function createUnsubscribeToken(emailHash: string): string {
  return `${emailHash}.${sign(emailHash)}`;
}

export function parseUnsubscribeToken(
  token: string,
): { emailHash: string } | null {
  const trimmed = token.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0) return null;
  const emailHash = trimmed.slice(0, dot);
  const signature = trimmed.slice(dot + 1);
  if (!/^[a-f0-9]{64}$/i.test(emailHash) || !signature) return null;

  const expected = sign(emailHash);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { emailHash };
}
