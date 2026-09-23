"use client";

import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { togglePoemLike } from "@/app/(site)/mcr-buzz/poets-corner/actions";
import { poemPath } from "@/lib/poets-corner";

type PoemLikeButtonProps = {
  poemId: string;
  initialLikes: number;
  initialLiked: boolean;
};

export function PoemLikeButton({
  poemId,
  initialLikes,
  initialLiked,
}: PoemLikeButtonProps) {
  const { data: session, status } = useSession();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(poemPath(poemId))}`;

  function onToggle() {
    if (status === "loading" || pending) return;
    if (!session?.user) {
      window.location.href = loginHref;
      return;
    }

    const nextLiked = !liked;
    const previousLikes = likes;
    const previousLiked = liked;
    setLiked(nextLiked);
    setLikes((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    setError(null);

    startTransition(async () => {
      const result = await togglePoemLike(poemId);
      if (!result.ok) {
        setLiked(previousLiked);
        setLikes(previousLikes);
        setError(result.error);
        return;
      }
      setLiked(result.liked);
      setLikes(result.likeCount);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending || status === "loading"}
        aria-pressed={liked}
        aria-label={liked ? "Unlike poem" : "Like poem"}
        className={`inline-flex items-center gap-1.5 text-sm font-semibold transition disabled:opacity-60 ${
          liked ? "text-[#7a3e3e]" : "text-[#6d5848] hover:text-[#7a3e3e]"
        }`}
      >
        <span
          className="material-symbols-outlined text-[1.35rem] leading-none"
          style={
            liked
              ? { fontVariationSettings: '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 24' }
              : undefined
          }
          aria-hidden
        >
          favorite
        </span>
        {likes}
      </button>
      {error ? (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
