import { ManchesterHistoryArticle } from "@/components/mcr-buzz/ManchesterHistoryArticle";
import { historySans, historySerif } from "@/fonts/history-fonts";
import { JsonLd, RelatedEventsWidget } from "@/components/seo";
import { getTodayEvents } from "@/lib/api";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import {
  MANCHESTER_HISTORY_IMAGES,
  MCR_HISTORY_DESCRIPTION,
  MCR_HISTORY_HEADLINE,
  MCR_HISTORY_KEYWORDS,
  MCR_HISTORY_LABEL,
  MCR_HISTORY_OG_IMAGE,
  MCR_HISTORY_PATH,
  MCR_HISTORY_PUBLISHED,
} from "@/lib/mcr-history";
import { buildPageMetadata, truncateSeoText } from "@/lib/seo";

const historyDescription = truncateSeoText(MCR_HISTORY_DESCRIPTION);

export const metadata = buildPageMetadata({
  title: `${MCR_HISTORY_HEADLINE} · MCR Buzz`,
  description: historyDescription,
  path: MCR_HISTORY_PATH,
  keywords: [...MCR_HISTORY_KEYWORDS],
  image: MCR_HISTORY_OG_IMAGE,
  imageAlt: "Modern Manchester city skyline",
  type: "article",
  publishedTime: `${MCR_HISTORY_PUBLISHED}T00:00:00.000Z`,
  modifiedTime: `${MCR_HISTORY_PUBLISHED}T00:00:00.000Z`,
});

export default async function ManchesterHistoryPage() {
  const todayEvents = await getTodayEvents();

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "MCR Buzz", path: "/mcr-buzz" },
          { name: MCR_HISTORY_LABEL, path: MCR_HISTORY_PATH },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          headline: MCR_HISTORY_HEADLINE,
          description: historyDescription,
          path: MCR_HISTORY_PATH,
          image: Object.values(MANCHESTER_HISTORY_IMAGES),
          datePublished: MCR_HISTORY_PUBLISHED,
        })}
      />
      <ManchesterHistoryArticle
        heroImageUrl={MANCHESTER_HISTORY_IMAGES.hero}
        className={`${historySerif.variable} ${historySans.variable}`}
      />
      <div className="mx-auto max-w-site px-grid-margin pb-16">
        <RelatedEventsWidget
          title="Meanwhile — events in Manchester today"
          events={todayEvents}
          moreHref="/events/today"
          moreLabel="Events in Manchester today"
        />
      </div>
    </>
  );
}
