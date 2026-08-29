import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { getOptionalSession } from "@/lib/session";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Shared chrome for public pages. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSession();

  return (
    <AuthSessionProvider session={session}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </AuthSessionProvider>
  );
}
