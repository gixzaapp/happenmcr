import type { CSSProperties } from "react";
import Link from "next/link";
import {
  MANCHESTER_HISTORY_IMAGES,
  MANCHESTER_HISTORY_SECTIONS,
  MANCHESTER_HISTORY_TIMELINE,
  MCR_HISTORY_HEADLINE,
} from "@/lib/mcr-history";
import { MCR_ON_LENS_PATH } from "@/lib/mcr-on-lens";
import styles from "./manchester-history.module.css";

type ManchesterHistoryArticleProps = {
  heroImageUrl: string;
  className?: string;
};

export function ManchesterHistoryArticle({
  heroImageUrl,
  className,
}: ManchesterHistoryArticleProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      style={
        {
          "--history-hero-image": `url('${heroImageUrl}')`,
        } as CSSProperties
      }
    >
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Cottonopolis to modern metropolis</p>
          <h1 className={styles.title}>{MCR_HISTORY_HEADLINE}</h1>
          <p className={styles.dek}>
            From a Roman garrison fort to the world&apos;s first industrial city
            — how a small Lancashire market town reshaped the modern world,
            twice.
          </p>
        </div>
      </header>

      <nav className={styles.timeline} aria-label="Key dates in Manchester history">
        <ul className={styles.timelineList}>
          {MANCHESTER_HISTORY_TIMELINE.map((item) => (
            <li key={item.year} className={styles.timelineItem}>
              <a href={`#${item.sectionId}`} className={styles.timelineLink}>
                <strong className={styles.timelineYear}>{item.year}</strong>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className={styles.main}>
        <article className={styles.article}>
          <p className={`${styles.paragraph} ${styles.lede}`}>
            Manchester&apos;s story is one of the most dramatic transformations
            in urban history — a shift from a quiet Lancashire township to the
            world&apos;s first industrial city, and later to a modern hub of
            culture, science, and sport.
          </p>

          <nav className={styles.toc} aria-label="On this page">
            <h2 className={styles.tocTitle}>On this page</h2>
            <ol className={styles.tocList}>
              {MANCHESTER_HISTORY_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <h2
            id="roman-origins"
            className={`${styles.sectionTitle} ${styles.sectionTitleFirst}`}
          >
            Roman Origins
          </h2>
          <p className={styles.paragraph}>
            Manchester&apos;s roots stretch back nearly 2,000 years to a Roman
            fort called <em>Mamucium</em>, built around AD 79 in what is now the
            Castlefield area. For centuries afterward, it remained a modest
            settlement, growing slowly through the medieval period as a market
            town known mainly for wool trading.
          </p>

          <figure className={styles.figure}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MANCHESTER_HISTORY_IMAGES.romanFort}
              alt="Reconstruction of the Roman fort at Castlefield, Manchester"
              className={styles.figureImage}
              loading="lazy"
              width={680}
              height={453}
            />
            <figcaption className={styles.caption}>
              The reconstructed north gate and ramparts of Mamucium, the Roman
              fort at Castlefield — the birthplace of Manchester.
            </figcaption>
          </figure>

          <h2 id="industrial-giant" className={styles.sectionTitle}>
            The Birth of an Industrial Giant
          </h2>
          <p className={styles.paragraph}>
            Manchester&apos;s true transformation began in the mid-18th century.
            At the start of the 1700s, it had a population of under 10,000.
            Everything changed with the arrival of new textile technology — most
            famously the spinning jenny, invented nearby in 1764, which
            mechanized cloth production for the first time.
          </p>
          <p className={styles.paragraph}>
            Manchester had the perfect ingredients for an industrial boom: a
            damp climate ideal for processing cotton, canal networks for
            transporting goods, and access to coal and raw materials. The opening
            of the first canal in 1762, followed by the city&apos;s first cotton
            mill in the early 1780s, set off explosive growth. By 1830,
            Manchester had 99 cotton-spinning mills, and by 1850, its population
            had swelled to roughly 400,000 — making it Britain&apos;s
            &quot;second city,&quot; behind only London.
          </p>

          <figure className={styles.figure}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MANCHESTER_HISTORY_IMAGES.mills}
              alt="McConnel and Company cotton mills, Manchester, about 1820"
              className={styles.figureImage}
              loading="lazy"
              width={680}
              height={453}
            />
            <figcaption className={styles.caption}>
              McConnel &amp; Company&apos;s mills, around 1820 — one of the great
              steam-powered cotton-spinning complexes that gave Manchester its
              industrial identity.
            </figcaption>
          </figure>

          <blockquote className={styles.pullquote}>
            This earned Manchester a lasting nickname — &quot;Cottonopolis,&quot;
            the world&apos;s first industrial city, where raw cotton arrived and
            finished cloth left to be sold across the globe.
          </blockquote>

          <h2 id="innovation-beyond-cotton" className={styles.sectionTitle}>
            Innovation Beyond Cotton
          </h2>
          <p className={styles.paragraph}>
            Manchester&apos;s ambitions didn&apos;t stop at textiles. In 1894, the
            37-mile Manchester Ship Canal opened, connecting the land-locked city
            directly to the sea and turning it into one of Britain&apos;s
            busiest ports. The city also became a magnet for engineering and
            scientific innovation — a tradition that would later produce the{" "}
            <strong className={styles.tag}>Manchester Baby</strong> in 1948,
            widely regarded as the world&apos;s first electronic stored-program
            computer, built with contributions from Alan Turing at the University
            of Manchester.
          </p>

          <figure className={styles.figure}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MANCHESTER_HISTORY_IMAGES.shipCanal}
              alt="Manchester Ship Canal at Salford Quays"
              className={styles.figureImage}
              loading="lazy"
              width={680}
              height={453}
            />
            <figcaption className={styles.caption}>
              The Manchester Ship Canal at Salford Quays — the 37-mile waterway
              that gave the landlocked city direct access to the sea from 1894.
            </figcaption>
          </figure>

          <h2 id="decline-and-reinvention" className={styles.sectionTitle}>
            Decline and Reinvention
          </h2>
          <p className={styles.paragraph}>
            The mid-20th century brought hard times, as the textile industry
            declined and much of Manchester&apos;s industrial base collapsed,
            leading to economic and social hardship. But from the 1990s onward,
            the city reinvented itself — investing heavily in culture, sport,
            and regeneration. Today&apos;s Manchester is known worldwide for its
            football clubs, its influential music scene (Joy Division, The
            Smiths, Oasis, and more), and its status as a major hub for media,
            science, and business in the north of England.
          </p>

          <figure className={styles.figure}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MANCHESTER_HISTORY_IMAGES.skyline}
              alt="Modern Manchester city skyline"
              className={styles.figureImage}
              loading="lazy"
              width={680}
              height={453}
            />
            <figcaption className={styles.caption}>
              Manchester&apos;s modern skyline — old mill chimneys and Victorian
              warehouses now sit alongside glass towers and regenerated waterfront
              quarters.
            </figcaption>
          </figure>

          <h2 id="city-shaping-world" className={styles.sectionTitle}>
            A City Still Shaping the World
          </h2>
          <p className={styles.paragraph}>
            From Roman fort to cotton capital to modern metropolis,
            Manchester&apos;s history reflects a city that has repeatedly
            reinvented itself. Its old mills now house apartments and
            start-ups, but the spirit behind the phrase once associated with the
            city —{" "}
            <em>
              &quot;what Manchester does today, the rest of the world does
              tomorrow&quot;
            </em>{" "}
            — still feels apt.
          </p>

          <nav className={styles.explore} aria-label="Explore more on HappenMCR">
            <h2 className={styles.exploreTitle}>Explore more</h2>
            <ul className={styles.exploreList}>
              <li>
                <Link href="/mcr-buzz">MCR Buzz hub</Link>
              </li>
              <li>
                <Link href={MCR_ON_LENS_PATH}>MCR on Lens</Link>
              </li>
              <li>
                <Link href="/events/today">Events in Manchester today</Link>
              </li>
              <li>
                <Link href="/community">Manchester community</Link>
              </li>
            </ul>
          </nav>
        </article>
      </main>

      <footer className={styles.footer}>
        Images courtesy of{" "}
        <a
          href="https://commons.wikimedia.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Wikimedia Commons
        </a>{" "}
        contributors, used under their respective Creative Commons licences.
      </footer>
    </div>
  );
}
