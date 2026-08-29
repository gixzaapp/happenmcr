import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Shared chrome for public pages. Session loads client-side (avoids headers() in ISR routes). */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </AuthSessionProvider>
  );
}
