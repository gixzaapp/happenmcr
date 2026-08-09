import sharp from "sharp";
import { getEventById } from "@/lib/api";
import { canShowEventImage } from "@/lib/source";

export type EventImageVariant = "og" | "hero" | "card";

const PRESETS: Record<
  EventImageVariant,
  { width: number; height: number; maxBytes: number; quality: number }
> = {
  og: { width: 1200, height: 630, maxBytes: 300_000, quality: 78 },
  hero: { width: 1600, height: 900, maxBytes: 220_000, quality: 72 },
  card: { width: 800, height: 500, maxBytes: 120_000, quality: 70 },
};

export async function fetchResizedEventImage(
  eventId: string,
  variant: EventImageVariant,
): Promise<{ body: Buffer; contentType: string } | null> {
  // Always read latest image_url — manual overrides must not wait on ISR cache.
  const event = await getEventById(eventId, { cache: "no-store" });
  if (!event || !canShowEventImage(event.source, event.image_url)) {
    return null;
  }

  const preset = PRESETS[variant];
  const upstream = await fetch(event.image_url!, {
    headers: {
      "User-Agent": "HappenMCR-Media/1.0",
      Accept: "image/*",
    },
    cache: "no-store",
  });

  if (!upstream.ok) return null;

  const input = Buffer.from(await upstream.arrayBuffer());
  let quality = preset.quality;
  let output = await sharp(input)
    .rotate()
    .resize(preset.width, preset.height, {
      fit: "cover",
      position: "centre",
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (output.byteLength > preset.maxBytes && quality > 40) {
    quality -= 8;
    output = await sharp(input)
      .rotate()
      .resize(preset.width, preset.height, {
        fit: "cover",
        position: "centre",
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  return { body: output, contentType: "image/jpeg" };
}

/** Public path for an already-resized event image. */
export function eventMediaPath(
  eventId: string,
  variant: EventImageVariant = "hero",
): string {
  return `/media/event/${encodeURIComponent(eventId)}?v=${variant}`;
}
