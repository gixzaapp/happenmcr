import { prisma } from "../../db.js";
import { getWeekendRange } from "../../lib/dates.js";
import { toEventDto } from "../../lib/mappers.js";
import { decryptEmail } from "../../lib/newsletter-crypto.js";
import { composeWeekendEmail, composeWelcomeEmail } from "./compose.js";
import { isNewsletterSendingConfigured, sendEmail } from "./mailer.js";
import { createUnsubscribeToken } from "./tokens.js";

function getSiteUrl(): string {
  return (
    process.env.SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://happenmcr.com"
  );
}

function unsubscribeUrlFor(emailHash: string): string {
  const token = createUnsubscribeToken(emailHash);
  return `${getSiteUrl()}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendWelcomeEmail(input: {
  email: string;
  emailHash: string;
}): Promise<void> {
  if (!isNewsletterSendingConfigured()) {
    console.warn("[newsletter] welcome skipped — RESEND_API_KEY not set");
    return;
  }

  const content = composeWelcomeEmail(unsubscribeUrlFor(input.emailHash));
  await sendEmail({
    to: input.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrlFor(input.emailHash)}>`,
    },
  });
}

export type WeeklySendResult = {
  attempted: number;
  sent: number;
  failed: number;
  skipped: boolean;
  eventCount: number;
  errors: string[];
};

/** Load weekend events and email every active subscriber. */
export async function sendWeeklyNewsletter(): Promise<WeeklySendResult> {
  if (!isNewsletterSendingConfigured()) {
    return {
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: true,
      eventCount: 0,
      errors: ["RESEND_API_KEY is not set"],
    };
  }

  const { start, end } = getWeekendRange();
  const events = await prisma.event.findMany({
    where: { startTime: { gte: start, lte: end } },
    orderBy: [{ isFree: "desc" }, { startTime: "asc" }],
    take: 40,
  });
  const dtos = events.map(toEventDto);

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { unsubscribedAt: null },
    select: { id: true, emailHash: true, emailEncrypted: true },
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const subscriber of subscribers) {
    try {
      const email = decryptEmail(subscriber.emailEncrypted);
      const unsub = unsubscribeUrlFor(subscriber.emailHash);
      const content = composeWeekendEmail(dtos, unsub);
      await sendEmail({
        to: email,
        subject: content.subject,
        html: content.html,
        text: content.text,
        headers: {
          "List-Unsubscribe": `<${unsub}>`,
        },
      });
      sent += 1;
      // Gentle pacing for free-tier providers.
      await sleep(200);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${subscriber.id}: ${message}`);
      console.error("[newsletter] send failed", subscriber.id, error);
    }
  }

  return {
    attempted: subscribers.length,
    sent,
    failed,
    skipped: false,
    eventCount: dtos.length,
    errors: errors.slice(0, 20),
  };
}
