import { auth } from "@/auth";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Shared chrome for public pages. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

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
