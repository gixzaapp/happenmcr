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

function sign(eventId: string, emailHash: string): string {
  return createHmac("sha256", getTokenSecret())
    .update(`event-reminder:${eventId}:${emailHash}`)
    .digest("base64url");
}

/** Opaque unsubscribe token for one email on one event. */
export function createReminderUnsubscribeToken(
  eventId: string,
  emailHash: string,
): string {
  return `${eventId}.${emailHash}.${sign(eventId, emailHash)}`;
}

export function parseReminderUnsubscribeToken(
  token: string,
): { eventId: string; emailHash: string } | null {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3) return null;
  const [eventId, emailHash, signature] = parts;
  if (!eventId || !/^[a-f0-9]{64}$/i.test(emailHash) || !signature) return null;

  const expected = sign(eventId, emailHash);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { eventId, emailHash };
}
