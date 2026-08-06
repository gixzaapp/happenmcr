import { Router, type Router as ExpressRouter } from "express";
import multer from "multer";
import { prisma } from "../db.js";
import { sendEmail, isNewsletterSendingConfigured } from "../services/newsletter/mailer.js";
import { getObjectStorage } from "../services/storage/index.js";
import {
  buildPromoImageKey,
  detectImageMime,
  isAllowedPromoImageMime,
  promoImageMaxBytes,
} from "../services/storage/promo-image.js";

const router: ExpressRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: promoImageMaxBytes(), files: 1 },
  fileFilter(_req, file, cb) {
    if (isAllowedPromoImageMime(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("INVALID_IMAGE_TYPE"));
  },
});

function trimString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function parseStartTime(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseIsFree(value: unknown): boolean {
  return value === true || value === "true";
}

router.post("/", (req, res, next) => {
  upload.single("promoImage")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          error: "Promo image must be 5MB or smaller.",
        });
        return;
      }
      res.status(400).json({ error: "Could not upload promo image." });
      return;
    }

    if (err instanceof Error && err.message === "INVALID_IMAGE_TYPE") {
      res.status(400).json({
        error: "Promo image must be a JPEG, PNG, or WebP file.",
      });
      return;
    }

    res.status(400).json({ error: "Could not upload promo image." });
  });
}, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    // Honeypot — bots fill hidden fields; humans leave empty.
    if (typeof body.website === "string" && body.website.trim()) {
      res.status(201).json({ data: { ok: true } });
      return;
    }

    const title = trimString(body.title, 200);
    const venueName = trimString(body.venueName, 200);
    const description = trimString(body.description, 5000);
    const ticketUrlRaw = trimString(body.ticketUrl, 2000);
    const contactEmail = trimString(body.contactEmail, 254)?.toLowerCase();
    const startTime = parseStartTime(body.startTime);
    const isFree = parseIsFree(body.isFree);

    if (!title) {
      res.status(400).json({ error: "Event title is required." });
      return;
    }
    if (!startTime) {
      res.status(400).json({ error: "A valid start date and time is required." });
      return;
    }
    if (!venueName) {
      res.status(400).json({ error: "Venue is required." });
      return;
    }
    if (!description) {
      res.status(400).json({ error: "Description is required." });
      return;
    }
    if (!contactEmail || !EMAIL_RE.test(contactEmail)) {
      res.status(400).json({ error: "A valid contact email is required." });
      return;
    }

    let ticketUrl: string | null = null;
    if (isFree) {
      if (ticketUrlRaw) {
        if (!URL_RE.test(ticketUrlRaw)) {
          res.status(400).json({
            error: "Event page URL must start with http:// or https://.",
          });
          return;
        }
        ticketUrl = ticketUrlRaw;
      }
    } else {
      if (!ticketUrlRaw || !URL_RE.test(ticketUrlRaw)) {
        res.status(400).json({
          error: "A valid ticket URL is required for paid events (starting with http).",
        });
        return;
      }
      ticketUrl = ticketUrlRaw;
    }

    let promoImageKey: string | null = null;
    let promoImageUrl: string | null = null;

    const file = req.file;
    if (file) {
      const detected = detectImageMime(file.buffer);
      if (!detected || detected !== file.mimetype) {
        res.status(400).json({
          error: "Promo image must be a valid JPEG, PNG, or WebP file.",
        });
        return;
      }

      const key = buildPromoImageKey(detected);
      const stored = await getObjectStorage().put({
        key,
        body: file.buffer,
        contentType: detected,
      });
      promoImageKey = stored.key;
      promoImageUrl = stored.url;
    }

    const submission = await prisma.eventSubmission.create({
      data: {
        title,
        startTime,
        venueName,
        description,
        isFree,
        ticketUrl,
        promoImageKey,
        promoImageUrl,
        contactEmail,
      },
    });

    if (isNewsletterSendingConfigured()) {
      const notifyTo =
        process.env.EVENT_SUBMISSION_TO?.trim() || "hello@happenmcr.com";
      const when = startTime.toLocaleString("en-GB", {
        timeZone: "Europe/London",
        dateStyle: "full",
        timeStyle: "short",
      });
      const pricingLabel = isFree ? "Free" : "Paid";
      const urlLabel = isFree ? "Event page" : "Tickets";
      const urlLine = ticketUrl ? `${urlLabel}: ${ticketUrl}` : `${urlLabel}: (none)`;
      const imageLine = promoImageUrl
        ? `Promo image: ${promoImageUrl}`
        : "Promo image: (none)";

      void sendEmail({
        to: notifyTo,
        subject: `New event submission: ${title}`,
        text: `New HappenMCR event submission

Title: ${title}
When: ${when}
Venue: ${venueName}
Pricing: ${pricingLabel}
${urlLine}
${imageLine}
Contact: ${contactEmail}
Submission ID: ${submission.id}

Description:
${description}
`,
        html: `<!doctype html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
  <h1 style="font-size:20px">New event submission</h1>
  <p><strong>Title:</strong> ${escapeHtml(title)}</p>
  <p><strong>When:</strong> ${escapeHtml(when)}</p>
  <p><strong>Venue:</strong> ${escapeHtml(venueName)}</p>
  <p><strong>Pricing:</strong> ${escapeHtml(pricingLabel)}</p>
  <p><strong>${escapeHtml(urlLabel)}:</strong> ${
    ticketUrl
      ? `<a href="${escapeHtml(ticketUrl)}">${escapeHtml(ticketUrl)}</a>`
      : "(none)"
  }</p>
  <p><strong>Promo image:</strong> ${
    promoImageUrl
      ? `<a href="${escapeHtml(promoImageUrl)}">${escapeHtml(promoImageUrl)}</a><br/><img src="${escapeHtml(promoImageUrl)}" alt="" width="320" style="max-width:100%;height:auto;margin-top:8px" />`
      : "(none)"
  }</p>
  <p><strong>Contact:</strong> <a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a></p>
  <p><strong>ID:</strong> ${escapeHtml(submission.id)}</p>
  <hr />
  <p style="white-space:pre-wrap">${escapeHtml(description)}</p>
</body></html>`,
      }).catch((error) => {
        console.error("[submit-event] notify email failed", error);
      });
    }

    res.status(201).json({ data: { ok: true, id: submission.id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not submit the event. Try again." });
  }
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default router;
