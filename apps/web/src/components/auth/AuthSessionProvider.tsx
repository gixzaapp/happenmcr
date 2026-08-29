"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

type AuthSessionProviderProps = {
  session: Session | null;
  children: React.ReactNode;
};

export function AuthSessionProvider({
  session,
  children,
}: AuthSessionProviderProps) {
  return (
    <SessionProvider session={session} basePath="/auth">
      {children}
    </SessionProvider>
  );
}
