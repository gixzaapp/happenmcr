import type { Request } from "express";

export type LensUploader = {
  userId: string;
  name: string | null;
  image: string | null;
};

/** Authenticated uploads from the Next.js server (not public). */
export function authorizeLensUpload(req: Request): LensUploader | null {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;

  const header = req.header("x-internal-auth");
  if (!header || header !== secret) return null;

  const userId = req.header("x-lens-user-id")?.trim();
  if (!userId) return null;

  const name = req.header("x-lens-user-name")?.trim() || null;
  const image = req.header("x-lens-user-image")?.trim() || null;

  return { userId, name, image };
}
