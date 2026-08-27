import { getApiBaseUrl } from "@/lib/config";
import type { LensPhoto } from "@/lib/mcr-on-lens";
import type { ApiResponse } from "@happenmcr/types";

export async function getLensPhotos(): Promise<LensPhoto[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/lens/photos`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const body = (await response.json()) as ApiResponse<LensPhoto[]>;
    return body.data ?? [];
  } catch {
    return [];
  }
}

export function getMapboxToken(): string | null {
  return (
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ||
    process.env.MAPBOX_ACCESS_TOKEN?.trim() ||
    null
  );
}
