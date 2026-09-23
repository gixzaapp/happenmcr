import type { ApiResponse } from "@happenmcr/types";
import { getApiBaseUrl } from "@/lib/config";
import { lensInternalAuthHeaders } from "@/lib/lens-api";
import type { Poem } from "@/lib/poets-corner";

export type PoetShowcase = {
  user_id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  poems: Array<{
    id: string;
    title: string;
    author_name: string;
    excerpt: string | null;
    image_url: string | null;
    like_count: number;
    created_at: string;
  }>;
};

function viewerHeaders(viewerUserId?: string | null): HeadersInit {
  if (!viewerUserId) return {};
  try {
    return lensInternalAuthHeaders(viewerUserId);
  } catch {
    return {};
  }
}

export async function getPoems(viewerUserId?: string | null): Promise<Poem[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/poems`, {
      cache: "no-store",
      headers: viewerHeaders(viewerUserId),
    });
    if (!response.ok) return [];
    const body = (await response.json()) as ApiResponse<Poem[]>;
    return body.data ?? [];
  } catch {
    return [];
  }
}

export async function getPoem(
  id: string,
  viewerUserId?: string | null,
): Promise<Poem | null> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/poems/${encodeURIComponent(id)}`,
      { cache: "no-store", headers: viewerHeaders(viewerUserId) },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as ApiResponse<Poem>;
    return body.data ?? null;
  } catch {
    return null;
  }
}

export async function getPoetShowcase(userId: string): Promise<PoetShowcase | null> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/poet-profiles/${encodeURIComponent(userId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as ApiResponse<PoetShowcase>;
    return body.data ?? null;
  } catch {
    return null;
  }
}
