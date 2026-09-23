"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePoem } from "@/app/(site)/mcr-buzz/poets-corner/actions";
import { poemEditPath } from "@/lib/poets-corner";
import Link from "next/link";

export function PoemOwnerActions({ poemId }: { poemId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this poem? This cannot be undone.")) return;
    setPending(true);
    setError(null);
    const result = await deletePoem(poemId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex items-center gap-4 text-sm">
      <Link href={poemEditPath(poemId)} className="font-semibold text-[#7a3e3e] underline">
        Edit
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="font-semibold text-[#6d5848] underline disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <p className="text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
