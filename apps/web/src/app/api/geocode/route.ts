import { NextResponse } from "next/server";
import type { GeocodeResponse, GeocodeSuggestion } from "@/lib/geocode";

const MANCHESTER_PROXIMITY = "-2.244644,53.480759";
const MAPBOX_TYPES = "place,address,poi";

type MapboxFeature = {
  id?: string;
  place_name?: string;
  center?: [number, number];
  context?: Array<{ id?: string; text?: string }>;
};

type MapboxGeocodeResponse = {
  features?: MapboxFeature[];
  message?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ data: [] } satisfies GeocodeResponse);
  }

  const token =
    process.env.MAPBOX_ACCESS_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

  if (!token) {
    return NextResponse.json(
      {
        data: [],
        error: "Mapbox access token is not configured.",
      } satisfies GeocodeResponse,
      { status: 503 },
    );
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("types", MAPBOX_TYPES);
  url.searchParams.set("country", "gb");
  url.searchParams.set("proximity", MANCHESTER_PROXIMITY);
  url.searchParams.set("limit", "6");
  url.searchParams.set("language", "en");

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as MapboxGeocodeResponse;
      return NextResponse.json(
        {
          data: [],
          error: body.message || "Geocoding request failed.",
        } satisfies GeocodeResponse,
        { status: 502 },
      );
    }

    const body = (await response.json()) as MapboxGeocodeResponse;
    const data: GeocodeSuggestion[] = (body.features ?? [])
      .filter(
        (feature): feature is MapboxFeature & {
          id: string;
          place_name: string;
          center: [number, number];
        } =>
          Boolean(feature.id) &&
          Boolean(feature.place_name) &&
          Array.isArray(feature.center) &&
          feature.center.length === 2,
      )
      .map((feature) => ({
        id: feature.id,
        place_name: feature.place_name,
        lng: feature.center[0],
        lat: feature.center[1],
        context: (feature.context ?? [])
          .filter(
            (item): item is { id: string; text: string } =>
              Boolean(item.id) && Boolean(item.text),
          )
          .map((item) => ({ id: item.id, text: item.text })),
      }));

    return NextResponse.json({ data } satisfies GeocodeResponse);
  } catch (error) {
    console.error("[geocode]", error);
    return NextResponse.json(
      {
        data: [],
        error: "Geocoding request failed.",
      } satisfies GeocodeResponse,
      { status: 502 },
    );
  }
}
