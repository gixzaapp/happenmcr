import { buildEventPath, type Event } from "@happenmcr/types";

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

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date TBC";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export type ReminderKind = "week" | "day";

export function composeEventReminderEmail(
  event: Event,
  kind: ReminderKind,
  unsubscribeUrl: string,
): { subject: string; html: string; text: string } {
  const site = getSiteUrl();
  const eventUrl = `${site}${buildEventPath(event)}`;
  const when = formatWhen(event.start_time);
  const where = event.venue_name?.trim() || "Venue TBC";
  const lead =
    kind === "week"
      ? "This is a week away."
      : "This is coming up tomorrow.";
  const subject =
    kind === "week"
      ? `A week to go: ${event.title}`
      : `Tomorrow: ${event.title}`;
  const ticket = event.ticket_url?.trim();
  const ticketHtml = ticket
    ? `<p style="margin:0 0 16px"><a href="${escapeHtml(ticket)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:6px">Book tickets</a></p>`
    : "";
  const ticketText = ticket ? `Book tickets: ${ticket}\n\n` : "";

  return {
    subject,
    html: `<!doctype html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111;background:#f6f6f6;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:28px;border:1px solid #eee">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#888">HappenMCR reminder</p>
    <h1 style="margin:0 0 12px;font-size:22px">${escapeHtml(event.title)}</h1>
    <p style="margin:0 0 16px">${escapeHtml(lead)} Please make sure you've booked your ticket.</p>
    <p style="margin:0 0 4px;font-size:14px"><strong>When</strong> · ${escapeHtml(when)}</p>
    <p style="margin:0 0 16px;font-size:14px"><strong>Where</strong> · ${escapeHtml(where)}</p>
    ${ticketHtml}
    <p style="margin:0 0 24px"><a href="${escapeHtml(eventUrl)}" style="color:#111">View the event on HappenMCR →</a></p>
    <p style="margin:0;font-size:12px;color:#888">
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#888">Stop reminders for this event</a>
    </p>
  </div>
</body></html>`,
    text: `${event.title}

${lead} Please make sure you've booked your ticket.

When: ${when}
Where: ${where}

${ticketText}Event: ${eventUrl}

Stop reminders: ${unsubscribeUrl}
`,
  };
}
