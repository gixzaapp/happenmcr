import { sendEmail, isNewsletterSendingConfigured } from "../newsletter/mailer.js";

export const POEM_REPORT_CATEGORIES = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright / not their work" },
  { value: "hate", label: "Hateful or abusive" },
  { value: "spam", label: "Spam or misleading" },
  { value: "other", label: "Other" },
] as const;

export type PoemReportCategory = (typeof POEM_REPORT_CATEGORIES)[number]["value"];

const ALLOWED = new Set<string>(POEM_REPORT_CATEGORIES.map((item) => item.value));

export function isPoemReportCategory(value: string): value is PoemReportCategory {
  return ALLOWED.has(value);
}

function categoryLabel(value: PoemReportCategory): string {
  return POEM_REPORT_CATEGORIES.find((item) => item.value === value)?.label ?? value;
}

function parseRecipients(): string[] {
  const raw =
    process.env.POETS_CORNER_REPORT_TO?.trim() ||
    process.env.LENS_REPORT_TO?.trim();
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

export async function notifyPoemReport(input: {
  poemId: string;
  category: PoemReportCategory;
  details: string | null;
  reporterEmail: string | null;
  title: string;
  authorName: string;
  poemUrl: string;
}): Promise<{ id: string } | null> {
  if (!isNewsletterSendingConfigured()) {
    console.warn("[poems] report notify skipped — RESEND_API_KEY is not set");
    return null;
  }

  const to = parseRecipients();
  if (to.length === 0) {
    console.error(
      "[poems] report notify skipped — set LENS_REPORT_TO or POETS_CORNER_REPORT_TO",
    );
    return null;
  }

  const label = categoryLabel(input.category);
  const details = input.details?.trim() || "(none)";
  const reporter = input.reporterEmail?.trim() || "(not provided)";

  const result = await sendEmail({
    to,
    replyTo: input.reporterEmail?.trim() || undefined,
    subject: `Poet's Corner report: ${label}`,
    text: `Poet's Corner poem report

Category: ${label}
Poem ID: ${input.poemId}
Title: ${input.title}
Author: ${input.authorName}
Page: ${input.poemUrl}
Reporter: ${reporter}

Details:
${details}
`,
    html: `<!doctype html>
<html><body style="font-family:Georgia,serif;line-height:1.5;color:#111">
  <h1 style="font-size:20px">Poet's Corner report</h1>
  <p><strong>Category:</strong> ${escapeHtml(label)}</p>
  <p><strong>Title:</strong> ${escapeHtml(input.title)}</p>
  <p><strong>Author:</strong> ${escapeHtml(input.authorName)}</p>
  <p><strong>Poem ID:</strong> ${escapeHtml(input.poemId)}</p>
  <p><a href="${escapeHtml(input.poemUrl)}">Open the poem</a></p>
  <p><strong>Reporter:</strong> ${escapeHtml(reporter)}</p>
  <p style="white-space:pre-wrap">${escapeHtml(details)}</p>
</body></html>`,
  });

  return { id: result.id };
}
