import { NextResponse } from "next/server";
import sharp from "sharp";
import { getEventById } from "@/lib/api";
import { canShowEventImage } from "@/lib/source";

export const runtime = "nodejs";
export const revalidate = 600;

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;
const MAX_BYTES = 300_000;

type RouteContext = {
  params: { id: string };
};

async function loadDefaultOg(): Promise<Response> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://happenmcr.com";
  const upstream = await fetch(`${origin}/opengraph-image`, {
    next: { revalidate: 86_400 },
  });
  if (!upstream.ok) {
    return new NextResponse("OG image unavailable", { status: 404 });
  }
  const buffer = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
    },
  });
}

/** WhatsApp-friendly resized event image served from happenmcr.com. */
export async function GET(_request: Request, context: RouteContext) {
  const event = await getEventById(context.params.id);
  if (!event || !canShowEventImage(event.source, event.image_url)) {
    return loadDefaultOg();
  }

  try {
    const upstream = await fetch(event.image_url!, {
      headers: {
        "User-Agent": "HappenMCR-OG/1.0",
        Accept: "image/*",
      },
      next: { revalidate: 600 },
    });

    if (!upstream.ok) {
      return loadDefaultOg();
    }

    const input = Buffer.from(await upstream.arrayBuffer());
    let quality = 80;
    let output = await sharp(input)
      .rotate()
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: "cover",
        position: "centre",
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    while (output.byteLength > MAX_BYTES && quality > 40) {
      quality -= 10;
      output = await sharp(input)
        .rotate()
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: "cover",
          position: "centre",
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[og/event] failed", context.params.id, error);
    return loadDefaultOg();
  }
}
