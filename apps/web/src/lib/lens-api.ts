export function getLensApiBase(): string {
  return process.env.API_URL?.replace(/\/$/, "") || "http://127.0.0.1:4000";
}

export function lensInternalAuthHeaders(userId: string): Record<string, string> {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return {
    "x-internal-auth": secret,
    "x-lens-user-id": userId,
  };
}

export function lensUploadHeaders(
  userId: string,
  name?: string | null,
  image?: string | null,
): Record<string, string> {
  const headers = lensInternalAuthHeaders(userId);
  if (name?.trim()) headers["x-lens-user-name"] = name.trim();
  if (image?.trim()) headers["x-lens-user-image"] = image.trim();
  return headers;
}
