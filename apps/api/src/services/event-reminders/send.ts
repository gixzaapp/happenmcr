import { prisma } from "../../db.js";
import { toEventDto } from "../../lib/mappers.js";
import { decryptEmail } from "../../lib/newsletter-crypto.js";
import { isNewsletterSendingConfigured, sendEmail } from "../newsletter/mailer.js";
import { composeEventReminderEmail, type ReminderKind } from "./compose.js";
import { createReminderUnsubscribeToken } from "./tokens.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Send the "week before" note while the start is 6–8 days away. */
const WEEK_MIN_MS = 6 * DAY_MS;
const WEEK_MAX_MS = 8 * DAY_MS;
/** Send the "day before" note once the start is inside the next 36 hours. */
const DAY_MAX_MS = 36 * HOUR_MS;

function getSiteUrl(): string {
  return (
    process.env.SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://happenmcr.com"
  );
}

function unsubscribeUrlFor(eventId: string, emailHash: string): string {
  const token = createReminderUnsubscribeToken(eventId, emailHash);
  return `${getSiteUrl()}/api/event-reminders/unsubscribe?token=${encodeURIComponent(token)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ReminderSendResult = {
  weekAttempted: number;
  weekSent: number;
  dayAttempted: number;
  daySent: number;
  failed: number;
  skipped: boolean;
  errors: string[];
};

async function deliver(
  rows: Array<{
    id: string;
    eventId: string;
    emailHash: string;
    emailEncrypted: string;
    event: Parameters<typeof toEventDto>[0];
  }>,
  kind: ReminderKind,
  errors: string[],
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  const stamp = kind === "week" ? "weekSentAt" : "daySentAt";

  for (const row of rows) {
    try {
      const email = decryptEmail(row.emailEncrypted);
      const unsub = unsubscribeUrlFor(row.eventId, row.emailHash);
      const content = composeEventReminderEmail(toEventDto(row.event), kind, unsub);
      await sendEmail({
        to: email,
        subject: content.subject,
        html: content.html,
        text: content.text,
        headers: {
          "List-Unsubscribe": `<${unsub}>`,
        },
      });
      await prisma.eventReminder.update({
        where: { id: row.id },
        data: { [stamp]: new Date() },
      });
      sent += 1;
      await sleep(200);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${row.id}: ${message}`);
      console.error(`[event-reminders] ${kind} send failed`, row.id, error);
    }
  }

  return { sent, failed };
}

/** Email people who asked to be reminded: once about a week out, once the day before. */
export async function sendDueEventReminders(): Promise<ReminderSendResult> {
  if (!isNewsletterSendingConfigured()) {
    return {
      weekAttempted: 0,
      weekSent: 0,
      dayAttempted: 0,
      daySent: 0,
      failed: 0,
      skipped: true,
      errors: ["RESEND_API_KEY is not set"],
    };
  }

  const now = Date.now();
  const weekFrom = new Date(now + WEEK_MIN_MS);
  const weekTo = new Date(now + WEEK_MAX_MS);
  const dayTo = new Date(now + DAY_MAX_MS);

  const [weekRows, dayRows] = await Promise.all([
    prisma.eventReminder.findMany({
      where: {
        weekSentAt: null,
        event: { startTime: { gte: weekFrom, lt: weekTo } },
      },
      include: { event: true },
    }),
    prisma.eventReminder.findMany({
      where: {
        daySentAt: null,
        event: { startTime: { gt: new Date(now), lte: dayTo } },
      },
      include: { event: true },
    }),
  ]);

  const errors: string[] = [];
  const week = await deliver(weekRows, "week", errors);
  const day = await deliver(dayRows, "day", errors);

  return {
    weekAttempted: weekRows.length,
    weekSent: week.sent,
    dayAttempted: dayRows.length,
    daySent: day.sent,
    failed: week.failed + day.failed,
    skipped: false,
    errors: errors.slice(0, 20),
  };
}
