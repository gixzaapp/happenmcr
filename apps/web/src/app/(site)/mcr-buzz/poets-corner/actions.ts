"use server";

import { auth } from "@/auth";
import { getLensApiBase, lensInternalAuthHeaders } from "@/lib/lens-api";

export type TogglePoemLikeResult =
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; error: string };

export async function togglePoemLike(poemId: string): Promise<TogglePoemLikeResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to like a poem." };
  }

  const id = poemId.trim();
  if (!id) return { ok: false, error: "Poem not found." };

  try {
    const response = await fetch(`${getLensApiBase()}/poems/${id}/like`, {
      method: "POST",
      headers: lensInternalAuthHeaders(session.user.id),
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      data?: { liked?: boolean; like_count?: number };
    };
    if (!response.ok) {
      return { ok: false, error: body.error || "Could not update like. Try again." };
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

export async function deletePoem(
  poemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to delete a poem." };
  }

  try {
    const response = await fetch(
      `${getLensApiBase()}/poems/${encodeURIComponent(poemId)}`,
      {
        method: "DELETE",
        headers: lensInternalAuthHeaders(session.user.id),
      },
    );
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      return { ok: false, error: body.error || "Could not delete the poem." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}
