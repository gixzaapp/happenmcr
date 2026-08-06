import { randomUUID } from "node:crypto";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function isAllowedPromoImageMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export function promoImageMaxBytes(): number {
  return MAX_BYTES;
}

/** Light magic-byte check so a renamed .exe cannot slip through. */
export function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // RIFF....WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export function buildPromoImageKey(contentType: string): string {
  const ext = EXT_BY_MIME[contentType] || ".bin";
  return `event-submissions/${randomUUID()}${ext}`;
}
