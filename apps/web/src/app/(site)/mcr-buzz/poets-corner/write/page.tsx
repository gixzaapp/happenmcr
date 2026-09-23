import { PoemWriteForm, PoemWriteSignIn } from "@/components/poets-corner";
import { JsonLd } from "@/components/seo";
import { auth } from "@/auth";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/jsonld";
import {
  POETS_CORNER_LABEL,
  POETS_CORNER_PATH,
  POETS_CORNER_WRITE_PATH,
} from "@/lib/poets-corner";
import { buildPageMetadata, truncateSeoText } from "@/lib/seo";
import styles from "@/components/poets-corner/poets-corner.module.css";

export const metadata = buildPageMetadata({
  title: `Write · ${POETS_CORNER_LABEL}`,
  description: truncateSeoText(
    "Share a poem on HappenMCR Poet's Corner — title, author, and an optional image.",
  ),
  path: POETS_CORNER_WRITE_PATH,
  keywords: ["write a poem", "Poet's Corner", "Manchester poetry", "HappenMCR"],
  index: false,
  follow: true,
});

export default async function PoetsCornerWritePage() {
  const session = await auth();

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: POETS_CORNER_LABEL, path: POETS_CORNER_PATH },
          { name: "Write", path: POETS_CORNER_WRITE_PATH },
        ])}
      />
      <header className={`${styles.sheet} mb-10 max-w-2xl`}>
        <p className={styles.kicker}>Write</p>
        <h1 className="mt-3 text-4xl font-medium">Leave a poem</h1>
      </header>
      {session?.user ? (
        <PoemWriteForm defaultAuthor={session.user.name?.trim() || ""} />
      ) : (
        <PoemWriteSignIn />
      )}
    </>
  );
}
