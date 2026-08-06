import { NextResponse } from "next/server";
import {
  fetchResizedEventImage,
  type EventImageVariant,
} from "@/lib/event-media";

export const runtime = "nodejs";
export const revalidate = 600;

type RouteContext = {
  params: { id: string };
};

function parseVariant(value: string | null): EventImageVariant {
  if (value === "og" || value === "card" || value === "hero") return value;
  return "hero";
}

async function loadDefaultOg(): Promise<Response> {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://happenmcr.com";
  const upstream = await fetch(`${origin}/opengraph-image`, {
    next: { revalidate: 86_400 },
  });
  if (!upstream.ok) {
    return new NextResponse("Image unavailable", { status: 404 });
  }
  const buffer = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
    },
  });
}

/** Resized event images for heroes / cards (WhatsApp OG uses /og/event). */
export async function GET(request: Request, context: RouteContext) {
  const variant = parseVariant(new URL(request.url).searchParams.get("v"));

  try {
    const resized = await fetchResizedEventImage(context.params.id, variant);
    if (!resized) {
      return variant === "og" ? loadDefaultOg() : new NextResponse(null, { status: 404 });
    }

    return new NextResponse(new Uint8Array(resized.body), {
      headers: {
        "Content-Type": resized.contentType,
        "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[media/event] failed", context.params.id, error);
    return variant === "og"
      ? loadDefaultOg()
      : new NextResponse(null, { status: 404 });
  }
}
