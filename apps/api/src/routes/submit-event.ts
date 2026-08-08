import { resolveEventCategoryLabel } from "@happenmcr/types";
import { Router, type Router as ExpressRouter } from "express";
import multer from "multer";
import { prisma } from "../db.js";
import { notifyEventSubmission } from "../services/submit-event/notify.js";
import { notifySubmissionOnSlack } from "../services/slack/submission-notify.js";
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
    const categoryRaw = trimString(body.category, 80);
    const category = categoryRaw
      ? resolveEventCategoryLabel(categoryRaw)
      : null;
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
    if (!category) {
      res.status(400).json({ error: "Please choose a category." });
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
        category,
        isFree,
        ticketUrl,
        promoImageKey,
        promoImageUrl,
        contactEmail,
      },
    });

    // Await notify so PM2 logs always show success/failure for this request.
    let notified = false;
    try {
      const notify = await notifyEventSubmission({
        id: submission.id,
        title,
        startTime,
        venueName,
        description,
        category,
        isFree,
        ticketUrl,
        promoImageUrl,
        contactEmail,
      });
      notified = Boolean(notify);
    } catch (error) {
      console.error("[submit-event] notify email failed", error);
    }

    let slackNotified = false;
    try {
      const slack = await notifySubmissionOnSlack(submission.id);
      slackNotified = slack === "sent";
    } catch (error) {
      console.error("[submit-event] slack notify failed", error);
    }

    res.status(201).json({
      data: { ok: true, id: submission.id, notified, slackNotified },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not submit the event. Try again." });
  }
});

export default router;
