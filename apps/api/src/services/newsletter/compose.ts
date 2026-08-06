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
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function composeWelcomeEmail(unsubscribeUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const site = getSiteUrl();
  return {
    subject: "You’re on the HappenMCR list",
    html: `<!doctype html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111;background:#f6f6f6;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:28px;border:1px solid #eee">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#888">HappenMCR</p>
    <h1 style="margin:0 0 16px;font-size:24px">You’re in.</h1>
    <p style="margin:0 0 16px">Every <strong>Thursday morning</strong> we’ll send a shortlist of the best Manchester events for the weekend ahead.</p>
    <p style="margin:0 0 24px"><a href="${escapeHtml(site)}" style="color:#111">Browse what’s on now →</a></p>
    <p style="margin:0;font-size:12px;color:#888">
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#888">Unsubscribe</a>
    </p>
  </div>
</body></html>`,
    text: `You're on the HappenMCR list.

Every Thursday morning we'll send a shortlist of the best Manchester events for the weekend ahead.

Browse: ${site}

Unsubscribe: ${unsubscribeUrl}
`,
  };
}

export function composeWeekendEmail(
  events: Event[],
  unsubscribeUrl: string,
): { subject: string; html: string; text: string } {
  const site = getSiteUrl();
  const weekendUrl = `${site}/events/weekend`;
  const top = events.slice(0, 8);

  const itemsHtml = top.length
    ? top
        .map((event) => {
          const href = `${site}${buildEventPath(event)}`;
          const where = event.venue_name?.trim() || "Venue TBC";
          return `<tr>
  <td style="padding:14px 0;border-bottom:1px solid #eee">
    <a href="${escapeHtml(href)}" style="color:#111;font-weight:700;text-decoration:none;font-size:16px">${escapeHtml(event.title)}</a>
    <div style="margin-top:4px;font-size:13px;color:#555">${escapeHtml(formatWhen(event.start_time))} · ${escapeHtml(where)}${event.is_free ? " · Free" : ""}</div>
  </td>
</tr>`;
        })
        .join("")
    : `<tr><td style="padding:14px 0;color:#555">Quiet weekend in the listings so far — check the site later in the week.</td></tr>`;

  const itemsText = top.length
    ? top
        .map(
          (event) =>
            `- ${event.title}\n  ${formatWhen(event.start_time)} · ${event.venue_name || "Venue TBC"}\n  ${site}${buildEventPath(event)}`,
        )
        .join("\n\n")
    : "Quiet weekend in the listings so far — check the site later in the week.";

  return {
    subject: "This weekend in Manchester — HappenMCR",
    html: `<!doctype html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111;background:#f6f6f6;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:28px;border:1px solid #eee">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#888">HappenMCR · Thursday shortlist</p>
    <h1 style="margin:0 0 12px;font-size:24px">This weekend’s picks</h1>
    <p style="margin:0 0 20px;color:#444">A quick shortlist of what’s worth your Friday–Sunday in Manchester.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${itemsHtml}</table>
    <p style="margin:24px 0 0">
      <a href="${escapeHtml(weekendUrl)}" style="display:inline-block;background:#ffcc00;color:#111;text-decoration:none;font-weight:700;padding:12px 18px">See all weekend events</a>
    </p>
    <p style="margin:28px 0 0;font-size:12px;color:#888">
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#888">Unsubscribe</a>
    </p>
  </div>
</body></html>`,
    text: `This weekend in Manchester — HappenMCR

${itemsText}

All weekend events: ${weekendUrl}

Unsubscribe: ${unsubscribeUrl}
`,
  };
}
