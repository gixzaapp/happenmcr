import type { Request } from "express";

/** Protect admin submission list/update routes. */
export function authorizeSubmissionsAdmin(req: Request): boolean {
  const expected = process.env.SUBMISSIONS_ADMIN_SECRET?.trim();
  if (!expected) return false;
  const header = req.header("x-admin-secret");
  return Boolean(header && header === expected);
}
