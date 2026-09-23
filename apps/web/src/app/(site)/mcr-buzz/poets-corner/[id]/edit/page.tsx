import { notFound, redirect } from "next/navigation";
import { PoemWriteForm } from "@/components/poets-corner";
import { auth } from "@/auth";
import { getPoem } from "@/lib/poems";
import { poemPath, POETS_CORNER_LABEL } from "@/lib/poets-corner";
import { buildPageMetadata } from "@/lib/seo";
import styles from "@/components/poets-corner/poets-corner.module.css";

type EditPoemPageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: EditPoemPageProps) {
  return buildPageMetadata({
    title: `Edit poem · ${POETS_CORNER_LABEL}`,
    description: "Edit a poem you shared on Poet's Corner.",
    path: `${poemPath(params.id)}/edit`,
    index: false,
    follow: true,
  });
}

export default async function EditPoemPage({ params }: EditPoemPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`${poemPath(params.id)}/edit`)}`);
  }

  const poem = await getPoem(params.id, session.user.id);
  if (!poem || poem.user_id !== session.user.id) notFound();

  return (
    <>
      <header className={`${styles.sheet} mb-10 max-w-2xl`}>
        <p className={styles.kicker}>Edit</p>
        <h1 className="mt-3 text-4xl font-medium">{poem.title}</h1>
      </header>
      <PoemWriteForm
        poemId={poem.id}
        defaultAuthor={poem.author_name}
        initial={{
          title: poem.title,
          authorName: poem.author_name,
          place: poem.place ?? "",
          dedication: poem.dedication ?? "",
          bodyHtml: poem.body_html,
          imageUrl: poem.image_url,
        }}
      />
    </>
  );
}
