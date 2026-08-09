import Link from "next/link";
import { JsonLd } from "@/components/seo";
import {
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "@/lib/jsonld";
import { REVALIDATE_SECONDS } from "@/lib/rendering";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = REVALIDATE_SECONDS;

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "How HappenMCR collects, uses, and protects your information on happenmcr.com.",
  path: "/privacy",
  keywords: ["privacy", "HappenMCR", "data protection"],
});

const sections = [
  {
    title: "Who we are",
    body: [
      "HappenMCR (“we”, “us”) operates happenmcr.com, a Manchester events discovery site. This policy explains what information we collect and how we use it.",
      "Contact: hello@happenmcr.com",
    ],
  },
  {
    title: "Information we collect",
    body: [
      "Newsletter details you provide, such as an email address when you join our list. We do not store newsletter emails in plaintext.",
      "Technical data such as browser type, device information, and approximate location derived from IP address, collected automatically when you visit the site.",
      "Usage data such as pages viewed and links clicked, used to understand how the site is used and to improve it.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "To run and improve HappenMCR, including event listings, search, and performance.",
      "To send optional newsletter updates when you have subscribed (we decrypt your email only when needed to send that message).",
      "To respond to enquiries you send us.",
      "To protect the site, prevent abuse, and meet legal obligations.",
    ],
  },
  {
    title: "How we protect newsletter emails",
    body: [
      "When you join the newsletter, your email address is encrypted before it is written to our database using industry-standard AES-256-GCM encryption.",
      "We also store a one-way keyed hash of your email so we can recognise repeat sign-ups without keeping a readable copy of the address in an index.",
      "Encryption keys are kept separately from the application database and are not exposed in the public website.",
      "When email sending is enabled, we may send a welcome message and a weekly Thursday shortlist via our email provider. Plaintext addresses are reconstructed only for delivery.",
      "You can unsubscribe using the link in any newsletter email.",
    ],
  },
  {
    title: "Event listings and third-party sources",
    body: [
      "Event details on HappenMCR are aggregated from public sources such as venue websites and ticketing platforms. Those listings may include publicly available titles, dates, venues, images, and ticket links.",
      "When you follow a ticket or source link, you leave HappenMCR and that third party’s privacy policy applies.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "We may use essential cookies needed for the site to work, and optional analytics cookies to understand traffic and improve the product.",
      "When configured, we use Google Tag Manager to load analytics tools such as Google Analytics. Those services may set cookies or similar technologies and process usage data according to Google’s policies.",
      "You can control cookies through your browser settings. Blocking some cookies may affect site features.",
    ],
  },
  {
    title: "Sharing your information",
    body: [
      "We do not sell your personal information.",
      "We may share data with service providers who help us host the site, send email, or analyse usage, only as needed to provide those services.",
      "We may disclose information if required by law or to protect HappenMCR, our users, or the public.",
    ],
  },
  {
    title: "How long we keep data",
    body: [
      "We keep encrypted newsletter records until you unsubscribe or ask us to delete them, plus technical logs for a limited period for security and operations.",
      "After you unsubscribe, we may retain a minimal record so we do not email you again by mistake, unless you ask for full deletion.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Depending on where you live (including the UK), you may have rights to access, correct, delete, or restrict use of your personal data, and to object to certain processing.",
      "To exercise these rights, email hello@happenmcr.com. If you subscribed to the newsletter, you can also unsubscribe using the link in any email.",
    ],
  },
  {
    title: "Children",
    body: [
      "HappenMCR is not aimed at children under 13, and we do not knowingly collect personal information from children under 13.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time. The “Last updated” date at the top of this page will change when we do. Continued use of happenmcr.com after changes means you accept the updated policy.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-grid-margin py-12 sm:py-16">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          homeBreadcrumb(),
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />
      <header className="border-b border-industrial-black/10 pb-8">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Legal
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-industrial-black sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-body-md text-secondary">
          Last updated: 9 August 2026
        </p>
        <p className="mt-4 text-body-md text-secondary">
          This policy applies to{" "}
          <a
            href="https://happenmcr.com"
            className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4 hover:text-primary"
          >
            happenmcr.com
          </a>
          .
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl font-bold text-industrial-black sm:text-2xl">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-body-md text-secondary">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-secondary">
        Questions? Email{" "}
        <a
          href="mailto:hello@happenmcr.com"
          className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4 hover:text-primary"
        >
          hello@happenmcr.com
        </a>{" "}
        or return to the{" "}
        <Link
          href="/"
          className="font-semibold text-industrial-black underline decoration-bee-yellow underline-offset-4 hover:text-primary"
        >
          homepage
        </Link>
        .
      </p>
    </div>
  );
}
