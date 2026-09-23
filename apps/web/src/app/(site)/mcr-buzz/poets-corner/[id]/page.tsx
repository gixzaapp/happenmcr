import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PoemDisclaimer,
  PoemLikeButton,
  PoemReportButton,
} from "@/components/poets-corner";
import { JsonLd } from "@/components/seo";
import { auth } from "@/auth";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/jsonld";
import { getPoem } from "@/lib/poems";
import {
  poemPath,
  poetProfilePath,
  POETS_CORNER_LABEL,
  POETS_CORNER_PATH,
} from "@/lib/poets-corner";
import { buildPageMetadata, truncateSeoText } from "@/lib/seo";
import styles from "@/components/poets-corner/poets-corner.module.css";

type PoemPageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PoemPageProps): Promise<Metadata> {
  const poem = await getPoem(params.id);
  if (!poem) {
    return buildPageMetadata({
      title: "Poem",
      description: "This poem could not be found.",
      path: poemPath(params.id),
      index: false,
    });
  }
  return buildPageMetadata({
    title: `${poem.title} · ${POETS_CORNER_LABEL}`,
    description: truncateSeoText(poem.excerpt || poem.title),
    path: poemPath(poem.id),
    keywords: ["Poet's Corner", poem.author_name, "Manchester poetry"],
  });
}

export default async function PoemPage({ params }: PoemPageProps) {
  const session = await auth();
  const poem = await getPoem(params.id, session?.user?.id);
  if (!poem) notFound();

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: POETS_CORNER_LABEL, path: POETS_CORNER_PATH },
          { name: poem.title, path: poemPath(poem.id) },
        ])}
      />
      <article className={`${styles.sheet} ${styles.paper} mx-auto max-w-2xl px-6 py-10 sm:px-10`}>
        {poem.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poem.image_url}
            alt=""
            className="mb-8 max-h-96 w-full rounded-sm object-cover"
          />
        ) : null}
        <p className={styles.kicker}>Poem</p>
        <h1 className="mt-3 text-4xl font-medium leading-tight sm:text-5xl">{poem.title}</h1>
        <p className={`${styles.author} text-lg`}>
          by{" "}
          {poem.user_id ? (
            <Link href={poetProfilePath(poem.user_id)} className="underline">
              {poem.author_name}
            </Link>
          ) : (
            poem.author_name
          )}
        </p>
        {poem.place ? (
          <p className="mt-3 text-sm uppercase tracking-[0.14em] text-[#8a5a42]">
            {poem.place}
          </p>
        ) : null}
        {poem.dedication ? (
          <p className="mt-4 italic text-[#6d5848]">For {poem.dedication}</p>
        ) : null}
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: poem.body_html }}
        />
        <div className="mt-8 flex items-center gap-6 border-t border-[#2a2118]/10 pt-5">
          <PoemLikeButton
            poemId={poem.id}
            initialLikes={poem.like_count}
            initialLiked={poem.liked}
          />
          <PoemReportButton poemId={poem.id} title={poem.title} />
        </div>
      </article>
      <PoemDisclaimer />
    </>
  );
}
