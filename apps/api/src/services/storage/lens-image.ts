import { randomUUID } from "node:crypto";
import {
  detectImageMime,
  isAllowedPromoImageMime,
  promoImageMaxBytes,
} from "./promo-image.js";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export {
  detectImageMime,
  isAllowedPromoImageMime as isAllowedLensImageMime,
  promoImageMaxBytes as lensImageMaxBytes,
};

export function buildLensImageKey(contentType: string): string {
  const ext = EXT_BY_MIME[contentType] || ".bin";
  return `lens/${randomUUID()}${ext}`;
}
