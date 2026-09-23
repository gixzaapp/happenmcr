import Link from "next/link";
import type { ReactNode } from "react";
import { poemPath, type Poem } from "@/lib/poets-corner";
import styles from "./poets-corner.module.css";

export function PoemCard({
  poem,
  footer,
}: {
  poem: Pick<Poem, "id" | "title" | "author_name" | "excerpt" | "image_url" | "like_count">;
  footer?: ReactNode;
}) {
  return (
    <li>
      <Link href={poemPath(poem.id)} className={`${styles.paper} ${styles.card} ${styles.sheet}`}>
        {poem.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poem.image_url}
            alt=""
            className="mb-4 max-h-48 w-full rounded-sm object-cover"
          />
        ) : null}
        <h2 className={styles.title}>{poem.title}</h2>
        <p className={styles.author}>{poem.author_name}</p>
        {poem.excerpt ? <p className={styles.excerpt}>{poem.excerpt}</p> : null}
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#8a5a42]">
          {poem.like_count} {poem.like_count === 1 ? "like" : "likes"}
        </p>
      </Link>
      {footer}
    </li>
  );
}
