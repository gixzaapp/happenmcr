import Link from "next/link";
import { PoemCard, PoemDisclaimer } from "@/components/poets-corner";
import { JsonLd } from "@/components/seo";
import { auth } from "@/auth";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/jsonld";
import { getPoems } from "@/lib/poems";
import {
  POETS_CORNER_DESCRIPTION,
  POETS_CORNER_LABEL,
  POETS_CORNER_PATH,
  POETS_CORNER_WRITE_PATH,
} from "@/lib/poets-corner";
import { buildPageMetadata, truncateSeoText } from "@/lib/seo";
import styles from "@/components/poets-corner/poets-corner.module.css";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: `${POETS_CORNER_LABEL} · MCR Buzz`,
  description: truncateSeoText(POETS_CORNER_DESCRIPTION),
  path: POETS_CORNER_PATH,
  keywords: ["Poet's Corner", "Manchester poetry", "MCR Buzz", "HappenMCR"],
});

export default async function PoetsCornerPage() {
  const session = await auth();
  const poems = await getPoems(session?.user?.id);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: POETS_CORNER_LABEL, path: POETS_CORNER_PATH },
        ])}
      />
      <header className={`${styles.sheet} max-w-3xl`}>
        <p className={styles.kicker}>MCR Buzz</p>
        <h1 className="mt-3 text-4xl font-medium sm:text-5xl">Poet&apos;s Corner</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#5c4a3a]">
          Manchester, in other people&apos;s lines. Read what&apos;s been shared, or
          leave a poem of your own.
        </p>
        <Link
          href={POETS_CORNER_WRITE_PATH}
          className="mt-6 inline-flex rounded-full border border-[#2a2118] px-5 py-2 text-sm font-semibold text-[#2a2118]"
        >
          Write
        </Link>
      </header>

      {poems.length === 0 ? (
        <p className={`${styles.sheet} mt-12 max-w-xl text-lg italic text-[#5c4a3a]`} role="status">
          No poems yet. The page is waiting for the first one.
        </p>
      ) : (
        <ul className="mt-12 grid list-none gap-6 p-0 sm:grid-cols-2">
          {poems.map((poem) => (
            <PoemCard key={poem.id} poem={poem} />
          ))}
        </ul>
      )}

      <PoemDisclaimer />
    </>
  );
}
