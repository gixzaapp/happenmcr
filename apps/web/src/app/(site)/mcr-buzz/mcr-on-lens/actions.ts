"use server";

import { auth } from "@/auth";
import { getLensApiBase, lensInternalAuthHeaders } from "@/lib/lens-api";

export type ToggleLensPhotoLikeResult =
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; error: string };

export async function toggleLensPhotoLike(
  photoId: string,
): Promise<ToggleLensPhotoLikeResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to like photos." };
  }

  const id = photoId.trim();
  if (!id) {
    return { ok: false, error: "Photo not found." };
  }

  try {
    const response = await fetch(`${getLensApiBase()}/lens/photos/${id}/like`, {
      method: "POST",
      headers: lensInternalAuthHeaders(session.user.id),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      data?: { liked?: boolean; like_count?: number };
    };

    if (!response.ok) {
      return {
        ok: false,
        error: body.error || "Could not update like. Try again.",
      };
    }

    return {
      ok: true,
      liked: Boolean(body.data?.liked),
      likeCount: body.data?.like_count ?? 0,
    };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}
