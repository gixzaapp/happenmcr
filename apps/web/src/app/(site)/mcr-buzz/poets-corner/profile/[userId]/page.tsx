import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoemCard, PoemDisclaimer, PoemOwnerActions, PoetProfileForm } from "@/components/poets-corner";
import { JsonLd } from "@/components/seo";
import { auth } from "@/auth";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/jsonld";
import { getPoetShowcase } from "@/lib/poems";
import {
  POETS_CORNER_LABEL,
  POETS_CORNER_PATH,
  poetProfilePath,
} from "@/lib/poets-corner";
import { buildPageMetadata, truncateSeoText } from "@/lib/seo";
import styles from "@/components/poets-corner/poets-corner.module.css";

type ProfilePageProps = {
  params: { userId: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const profile = await getPoetShowcase(params.userId);
  if (!profile) {
    return buildPageMetadata({
      title: "Poet",
      description: "This poet profile could not be found.",
      path: poetProfilePath(params.userId),
      index: false,
    });
  }
  return buildPageMetadata({
    title: `${profile.name} · ${POETS_CORNER_LABEL}`,
    description: truncateSeoText(profile.bio || `Poems by ${profile.name} on HappenMCR.`),
    path: poetProfilePath(profile.user_id),
    keywords: [profile.name, "Poet's Corner", "Manchester poetry"],
  });
}

export default async function PoetPublicProfilePage({ params }: ProfilePageProps) {
  const session = await auth();
  const profile = await getPoetShowcase(params.userId);
  if (!profile) notFound();

  const isOwner = session?.user?.id === profile.user_id;
  const initial = profile.name.trim().charAt(0).toUpperCase() || "P";

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: POETS_CORNER_LABEL, path: POETS_CORNER_PATH },
          { name: profile.name, path: poetProfilePath(profile.user_id) },
        ])}
      />
      <article className={`${styles.sheet} ${styles.paper} mx-auto max-w-3xl px-6 py-10 sm:px-10`}>
        <p className={styles.kicker}>Poet</p>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          {profile.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image_url}
              alt=""
              className="h-32 w-32 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-[#2a2118] text-4xl text-[#f7f1e8]"
              aria-hidden
            >
              {initial}
            </div>
          )}
          <div>
            <h1 className="text-4xl font-medium leading-tight">{profile.name}</h1>
            {profile.bio ? (
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#3d3228]">{profile.bio}</p>
            ) : (
              <p className="mt-4 italic text-[#6d5848]">No bio yet.</p>
            )}
          </div>
        </div>
        {isOwner ? (
          <PoetProfileForm
            name={profile.name === "Poet" ? "" : profile.name}
            bio={profile.bio}
            imageUrl={profile.image_url}
          />
        ) : null}
      </article>

      <section className="mx-auto mt-12 max-w-3xl" aria-labelledby="poet-works">
        <h2 id="poet-works" className={`${styles.sheet} text-2xl`}>
          Works
        </h2>
        {profile.poems.length === 0 ? (
          <p className={`${styles.sheet} mt-6 italic text-[#5c4a3a]`} role="status">
            No poems yet.
          </p>
        ) : (
          <ul className="mt-6 grid list-none gap-6 p-0 sm:grid-cols-2">
            {profile.poems.map((poem) => (
              <PoemCard
                key={poem.id}
                poem={{ ...poem, like_count: poem.like_count }}
                footer={isOwner ? <PoemOwnerActions poemId={poem.id} /> : null}
              />
            ))}
          </ul>
        )}
      </section>
      <PoemDisclaimer />
    </>
  );
}
