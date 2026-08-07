import { buildEventPath } from "@happenmcr/types";
import type { Event, EventSubmission } from "@prisma/client";
import {
  isNewsletterSendingConfigured,
  sendEmail,
} from "../newsletter/mailer.js";

function getSiteUrl(): string {
  return (
    process.env.SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://happenmcr.com"
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Email the organiser after approve/reject. Never throws (logs instead). */
export async function notifyOrganiserOutcome(input: {
  submission: EventSubmission;
  outcome: "approved" | "rejected";
  event?: Event | null;
}): Promise<void> {
  if (!isNewsletterSendingConfigured()) {
    console.warn(
      "[submit-event] organiser notify skipped — RESEND_API_KEY not set",
    );
    return;
  }

  const to = input.submission.contactEmail.trim().toLowerCase();
  if (!to) return;

  const title = input.submission.title;
  const siteUrl = getSiteUrl();

  try {
    if (input.outcome === "approved" && input.event) {
      const path = buildEventPath({
        id: input.event.id,
        title: input.event.title,
        venue_name: input.event.venueName,
      });
      const eventUrl = `${siteUrl}${path}`;

      await sendEmail({
        to,
        subject: `Your event is live on HappenMCR: ${title}`,
        text: `Hi,

Good news — “${title}” has been approved and is now listed on HappenMCR.

View it here:
${eventUrl}

Thanks for sharing what’s on in Manchester.
— HappenMCR
`,
        html: `<!doctype html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
  <p>Hi,</p>
  <p>Good news — <strong>${escapeHtml(title)}</strong> has been approved and is now listed on HappenMCR.</p>
  <p><a href="${escapeHtml(eventUrl)}">View your event</a></p>
  <p>Thanks for sharing what’s on in Manchester.<br/>— HappenMCR</p>
</body></html>`,
      });
    } else {
      await sendEmail({
        to,
        subject: `Update on your HappenMCR submission: ${title}`,
        text: `Hi,

Thanks for submitting “${title}” to HappenMCR.

We weren’t able to list this event this time. You’re welcome to update the details and submit again if you like.

If you have questions, reply to this email or write to hello@happenmcr.com.

— HappenMCR
`,
        html: `<!doctype html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
  <p>Hi,</p>
  <p>Thanks for submitting <strong>${escapeHtml(title)}</strong> to HappenMCR.</p>
  <p>We weren’t able to list this event this time. You’re welcome to update the details and submit again if you like.</p>
  <p>If you have questions, reply to this email or write to <a href="mailto:hello@happenmcr.com">hello@happenmcr.com</a>.</p>
  <p>— HappenMCR</p>
</body></html>`,
      });
    }

    console.info(
      `[submit-event] organiser ${input.outcome} email sent to=${to} submission=${input.submission.id}`,
    );
  } catch (error) {
    console.error(
      `[submit-event] organiser ${input.outcome} email failed submission=${input.submission.id}`,
      error,
    );
  }
}
