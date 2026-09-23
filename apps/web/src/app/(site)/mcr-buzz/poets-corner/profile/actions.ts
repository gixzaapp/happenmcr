"use server";

import { auth } from "@/auth";
import { getLensApiBase, lensUploadHeaders } from "@/lib/lens-api";

export async function savePoetProfile(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to edit your profile." };
  }

  try {
    const response = await fetch(
      `${getLensApiBase()}/poet-profiles/${encodeURIComponent(session.user.id)}`,
      {
        method: "PUT",
        headers: lensUploadHeaders(
          session.user.id,
          session.user.name,
          session.user.image,
        ),
        body: formData,
      },
    );
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      return { ok: false, error: body.error || "Could not save your profile." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}
