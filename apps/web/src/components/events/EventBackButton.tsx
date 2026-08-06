"use client";

import { useRouter } from "next/navigation";

type EventBackButtonProps = {
  fallbackHref?: string;
};

export function EventBackButton({
  fallbackHref = "/events/today",
}: EventBackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const referrer = document.referrer;
        if (referrer && referrer.startsWith(window.location.origin)) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--muted)] transition hover:text-[color:var(--ink)]"
    >
      <span className="material-symbols-outlined text-xl">arrow_back</span>
      Back
    </button>
  );
}
