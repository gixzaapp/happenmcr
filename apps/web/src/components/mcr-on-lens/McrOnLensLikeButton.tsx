"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { toggleLensPhotoLike } from "@/app/(site)/mcr-buzz/mcr-on-lens/actions";
import { MCR_ON_LENS_PATH } from "@/lib/mcr-on-lens";

type McrOnLensLikeButtonProps = {
  photoId: string;
  initialLikes: number;
  initialLiked: boolean;
};

export function McrOnLensLikeButton({
  photoId,
  initialLikes,
  initialLiked,
}: McrOnLensLikeButtonProps) {
  const { data: session, status } = useSession();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loginHref = `/login?callbackUrl=${encodeURIComponent(MCR_ON_LENS_PATH)}`;

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
      const result = await toggleLensPhotoLike(photoId);
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
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending || status === "loading"}
        aria-pressed={liked}
        aria-label={liked ? "Unlike photo" : "Like photo"}
        className={`inline-flex items-center gap-1.5 text-sm font-semibold transition disabled:opacity-60 ${
          liked ? "text-primary" : "text-secondary hover:text-primary"
        }`}
      >
        <span
          className="material-symbols-outlined text-xl"
          style={{ fontVariationSettings: liked ? '"FILL" 1' : '"FILL" 0' }}
          aria-hidden
        >
          favorite
        </span>
        {likes}
      </button>
      {error ? (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {error}{" "}
          {!session?.user ? (
            <Link href={loginHref} className="underline">
              Sign in
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
