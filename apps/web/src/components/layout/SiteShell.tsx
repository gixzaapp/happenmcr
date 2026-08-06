import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Shared chrome for public pages — no request APIs so routes can use ISR. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
