import { auth } from "@/auth";
import type { Session } from "next-auth";

/** Load session without failing public pages when auth/DB is misconfigured. */
export async function getOptionalSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch (error) {
    console.error("[auth] Failed to load session:", error);
    return null;
  }
}
