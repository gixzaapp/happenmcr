"use server";

import { auth } from "@/auth";
import { getLensApiBase, lensUploadHeaders } from "@/lib/lens-api";

export type SubmitPoemResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function submitPoem(formData: FormData): Promise<SubmitPoemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to share a poem." };
  }

  try {
    const response = await fetch(`${getLensApiBase()}/poems`, {
      method: "POST",
      headers: lensUploadHeaders(
        session.user.id,
        session.user.name,
        session.user.image,
      ),
      body: formData,
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      data?: { id?: string };
    };
    if (!response.ok || !body.data?.id) {
      return { ok: false, error: body.error || "Could not save the poem. Try again." };
    }
    return { ok: true, id: body.data.id };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}

export async function updatePoem(
  poemId: string,
  formData: FormData,
): Promise<SubmitPoemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to edit a poem." };
  }

  try {
    const response = await fetch(`${getLensApiBase()}/poems/${encodeURIComponent(poemId)}`, {
      method: "PATCH",
      headers: lensUploadHeaders(
        session.user.id,
        session.user.name,
        session.user.image,
      ),
      body: formData,
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      data?: { id?: string };
    };
    if (!response.ok || !body.data?.id) {
      return { ok: false, error: body.error || "Could not update the poem. Try again." };
    }
    return { ok: true, id: body.data.id };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}
