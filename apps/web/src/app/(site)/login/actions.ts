"use server";

import { signIn } from "@/auth";

/** Auth.js signIn redirects by throwing — must propagate that. */
export async function signInWithGoogle(callbackUrl: string): Promise<void> {
  await signIn("google", { redirectTo: callbackUrl || "/" });
}

export async function signInWithFacebook(callbackUrl: string): Promise<void> {
  await signIn("facebook", { redirectTo: callbackUrl || "/" });
}
