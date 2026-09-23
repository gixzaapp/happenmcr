import Link from "next/link";
import { POETS_CORNER_PROFILE_PATH, POETS_CORNER_WRITE_PATH } from "@/lib/poets-corner";

export function PoemWriteSignIn({
  title = "Sign in to write",
  body = "A HappenMCR account keeps a name on the poem and lets people like it.",
  callbackPath = POETS_CORNER_WRITE_PATH,
}: {
  title?: string;
  body?: string;
  callbackPath?: string;
}) {
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;

  return (
    <section className="mx-auto max-w-xl">
      <h2
        className="text-3xl text-[#2a2118]"
        style={{ fontFamily: "var(--font-history-serif), Georgia, serif" }}
      >
        {title}
      </h2>
      <p className="mt-3 text-[#5c4a3a]">{body}</p>
      <Link
        href={loginHref}
        className="mt-8 inline-flex rounded-full bg-[#2a2118] px-6 py-3 text-sm font-semibold text-[#f7f1e8]"
      >
        Sign in
      </Link>
    </section>
  );
}
