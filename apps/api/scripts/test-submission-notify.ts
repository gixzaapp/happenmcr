/**
 * Send a test event-submission notify email via Resend.
 *
 * Usage (from apps/api):
 *   pnpm exec tsx scripts/test-submission-notify.ts
 */
import "../src/load-env.js";

const to = process.env.EVENT_SUBMISSION_TO?.trim() || "(unset)";
console.log(`EVENT_SUBMISSION_TO from env = ${to}`);

const { notifyEventSubmission } = await import(
  "../src/services/submit-event/notify.js"
);

const result = await notifyEventSubmission({
  id: "test-local",
  title: "Test submission notify",
  startTime: new Date(Date.now() + 86_400_000),
  venueName: "Test Venue, Manchester",
  description: "If you received this, EVENT_SUBMISSION_TO + Resend are working.",
  category: "Other",
  isFree: true,
  ticketUrl: "https://happenmcr.com",
  promoImageUrl: null,
  contactEmail: "test@example.com",
});

if (!result) {
  console.error("Notify was skipped (check RESEND_API_KEY / EVENT_SUBMISSION_TO).");
  process.exitCode = 1;
} else {
  console.log("OK", result);
}
