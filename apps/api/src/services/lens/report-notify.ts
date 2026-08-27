import { sendEmail, isNewsletterSendingConfigured } from "../newsletter/mailer.js";
import {
  lensReportCategoryLabel,
  type LensReportCategory,
} from "./report-categories.js";

export type LensReportNotifyInput = {
  photoId: string;
  category: LensReportCategory;
  details: string | null;
  reporterEmail: string | null;
  photoTitle: string;
  photoUrl: string;
  location: string | null;
  feedUrl: string;
};

function parseRecipients(): string[] {
  const raw = process.env.LENS_REPORT_TO?.trim();
  if (!raw) return [];
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

export async function notifyLensPhotoReport(
  input: LensReportNotifyInput,
): Promise<{ id: string; to: string[] } | null> {
  if (!isNewsletterSendingConfigured()) {
    console.warn(
      "[lens] report notify skipped — RESEND_API_KEY is not set on this process",
    );
    return null;
  }

  const to = parseRecipients();
  if (to.length === 0) {
    console.error(
      "[lens] report notify skipped — set LENS_REPORT_TO in apps/api/.env",
    );
    return null;
  }

  const categoryLabel = lensReportCategoryLabel(input.category);
  const detailsBlock = input.details?.trim() || "(none)";
  const reporterBlock = input.reporterEmail?.trim() || "(not provided)";
  const locationBlock = input.location?.trim() || "(none)";

  const result = await sendEmail({
    to,
    replyTo: input.reporterEmail?.trim() || undefined,
    subject: `MCR on Lens report: ${categoryLabel}`,
    text: `MCR on Lens photo report

Category: ${categoryLabel}
Photo ID: ${input.photoId}
Title: ${input.photoTitle}
Location: ${locationBlock}
Image: ${input.photoUrl}
Feed: ${input.feedUrl}
Reporter: ${reporterBlock}

Details:
${detailsBlock}
`,
    html: `<!doctype html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
  <h1 style="font-size:20px">MCR on Lens photo report</h1>
  <p><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
  <p><strong>Photo ID:</strong> ${escapeHtml(input.photoId)}</p>
  <p><strong>Title:</strong> ${escapeHtml(input.photoTitle)}</p>
  <p><strong>Location:</strong> ${escapeHtml(locationBlock)}</p>
  <p><strong>Image:</strong> <a href="${escapeHtml(input.photoUrl)}">${escapeHtml(input.photoUrl)}</a></p>
  <p><strong>Feed:</strong> <a href="${escapeHtml(input.feedUrl)}">${escapeHtml(input.feedUrl)}</a></p>
  <p><strong>Reporter:</strong> ${
    input.reporterEmail
      ? `<a href="mailto:${escapeHtml(input.reporterEmail)}">${escapeHtml(input.reporterEmail)}</a>`
      : "(not provided)"
  }</p>
  <hr />
  <p style="white-space:pre-wrap">${escapeHtml(detailsBlock)}</p>
</body></html>`,
  });

  console.info(
    `[lens] report sent id=${result.id} to=${to.join(",")} photo=${input.photoId}`,
  );
  return { id: result.id, to };
}
