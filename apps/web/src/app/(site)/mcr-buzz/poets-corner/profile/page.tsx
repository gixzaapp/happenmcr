import { redirect } from "next/navigation";
import { PoemWriteSignIn } from "@/components/poets-corner";
import { auth } from "@/auth";
import { poetProfilePath } from "@/lib/poets-corner";
import { buildPageMetadata } from "@/lib/seo";
import { POETS_CORNER_PROFILE_PATH } from "@/lib/poets-corner";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Profile · Poet's Corner",
  description: "Your public Poet's Corner profile.",
  path: POETS_CORNER_PROFILE_PATH,
  index: false,
  follow: true,
});

export default async function PoetProfileEntryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <PoemWriteSignIn
        title="Sign in to open your profile"
        body="Your profile is a public page for your name, bio, picture, and poems."
        callbackPath={POETS_CORNER_PROFILE_PATH}
      />
    );
  }
  redirect(poetProfilePath(session.user.id));
}
