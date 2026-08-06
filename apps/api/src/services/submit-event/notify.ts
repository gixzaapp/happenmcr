import { sendEmail, isNewsletterSendingConfigured } from "../newsletter/mailer.js";

export type SubmissionNotifyInput = {
  id: string;
  title: string;
  startTime: Date;
  venueName: string;
  description: string;
  isFree: boolean;
  ticketUrl: string | null;
  promoImageUrl: string | null;
  contactEmail: string;
};

function parseRecipients(): string[] {
  const raw =
    process.env.EVENT_SUBMISSION_TO?.trim() || "hello@happenmcr.com";
  return raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Notify HappenMCR ops about a new organiser submission.
 * Throws on provider failure so callers can log clearly.
 */
export async function notifyEventSubmission(
  input: SubmissionNotifyInput,
): Promise<{ id: string; to: string[] } | null> {
  if (!isNewsletterSendingConfigured()) {
    console.warn(
      "[submit-event] notify skipped — RESEND_API_KEY is not set on this process",
    );
    return null;
  }

  const to = parseRecipients();
  if (to.length === 0) {
    console.warn("[submit-event] notify skipped — EVENT_SUBMISSION_TO is empty");
    return null;
  }

  if (!process.env.EVENT_SUBMISSION_TO?.trim()) {
    console.warn(
      "[submit-event] EVENT_SUBMISSION_TO unset — using default hello@happenmcr.com. Set EVENT_SUBMISSION_TO to an inbox that can receive mail (e.g. your Gmail).",
    );
  }

  const when = input.startTime.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "full",
    timeStyle: "short",
  });
  const pricingLabel = input.isFree ? "Free" : "Paid";
  const urlLabel = input.isFree ? "Event page" : "Tickets";
  const urlLine = input.ticketUrl
    ? `${urlLabel}: ${input.ticketUrl}`
    : `${urlLabel}: (none)`;
  const imageLine = input.promoImageUrl
    ? `Promo image: ${input.promoImageUrl}`
    : "Promo image: (none)";

  const result = await sendEmail({
    to,
    replyTo: input.contactEmail,
    subject: `New event submission: ${input.title}`,
    text: `New HappenMCR event submission

Title: ${input.title}
When: ${when}
Venue: ${input.venueName}
Pricing: ${pricingLabel}
${urlLine}
${imageLine}
Contact: ${input.contactEmail}
Submission ID: ${input.id}

Description:
${input.description}
`,
    html: `<!doctype html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
  <h1 style="font-size:20px">New event submission</h1>
  <p><strong>Title:</strong> ${escapeHtml(input.title)}</p>
  <p><strong>When:</strong> ${escapeHtml(when)}</p>
  <p><strong>Venue:</strong> ${escapeHtml(input.venueName)}</p>
  <p><strong>Pricing:</strong> ${escapeHtml(pricingLabel)}</p>
  <p><strong>${escapeHtml(urlLabel)}:</strong> ${
    input.ticketUrl
      ? `<a href="${escapeHtml(input.ticketUrl)}">${escapeHtml(input.ticketUrl)}</a>`
      : "(none)"
  }</p>
  <p><strong>Promo image:</strong> ${
    input.promoImageUrl
      ? `<a href="${escapeHtml(input.promoImageUrl)}">${escapeHtml(input.promoImageUrl)}</a>`
      : "(none)"
  }</p>
  <p><strong>Contact:</strong> <a href="mailto:${escapeHtml(input.contactEmail)}">${escapeHtml(input.contactEmail)}</a></p>
  <p><strong>ID:</strong> ${escapeHtml(input.id)}</p>
  <hr />
  <p style="white-space:pre-wrap">${escapeHtml(input.description)}</p>
</body></html>`,
  });

  console.info(
    `[submit-event] notify sent id=${result.id} to=${to.join(",")} submission=${input.id}`,
  );
  return { id: result.id, to };
}
