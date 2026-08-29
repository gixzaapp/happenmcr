"use server";

import { auth } from "@/auth";

export type UploadLensPhotoResult =
  | { ok: true }
  | { ok: false; error: string };

export async function uploadLensPhoto(
  formData: FormData,
): Promise<UploadLensPhotoResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to upload photos." };
  }

  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    return { ok: false, error: "Upload is not configured." };
  }

  const apiUrl =
    process.env.API_URL?.replace(/\/$/, "") || "http://127.0.0.1:4000";

  const headers: Record<string, string> = {
    "x-internal-auth": secret,
    "x-lens-user-id": session.user.id,
  };
  if (session.user.name?.trim()) {
    headers["x-lens-user-name"] = session.user.name.trim();
  }
  if (session.user.image?.trim()) {
    headers["x-lens-user-image"] = session.user.image.trim();
  }

  const response = await fetch(`${apiUrl}/lens/photos`, {
    method: "POST",
    headers,
    body: formData,
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    return {
      ok: false,
      error: body.error || "Could not upload the photo. Try again.",
    };
  }

  return { ok: true };
}
