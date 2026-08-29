import Link from "next/link";
import { SignInButtons } from "@/components/auth/SignInButtons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Sign in",
  description: "Sign in to HappenMCR with Google or Facebook.",
  path: "/login",
  index: false,
  follow: false,
});

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-grid-margin py-stack-lg">
      <div className="rounded-2xl bg-white p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-industrial-black/5">
        <h1 className="font-display text-headline-md text-industrial-black">
          Sign in
        </h1>
        <p className="mt-2 text-body-md text-secondary">
          Use your Google or Facebook account to continue on HappenMCR.
        </p>

        <div className="mt-8">
          <SignInButtons />
        </div>

        <p className="mt-6 text-center text-xs text-secondary">
          By continuing, you agree to our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
