import type { Request } from "express";
import { Router, type Router as ExpressRouter } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { encryptEmail, hashEmail } from "../lib/newsletter-crypto.js";
import { runEventReminders } from "../jobs/event-reminder-cron.js";
import { parseReminderUnsubscribeToken } from "../services/event-reminders/tokens.js";

const router: ExpressRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

function authorizeSend(req: Request): boolean {
  const expected = process.env.NEWSLETTER_SEND_SECRET?.trim();
  if (!expected) return false;
  const header = req.header("x-newsletter-secret");
  return Boolean(header && header === expected);
}

router.post("/", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }

    const eventId =
      typeof req.body?.eventId === "string" ? req.body.eventId.trim() : "";
    if (!eventId) {
      res.status(400).json({ error: "Missing event." });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, startTime: true },
    });
    if (!event) {
      res.status(404).json({ error: "Event not found." });
      return;
    }
    if (event.startTime.getTime() <= Date.now()) {
      res.status(400).json({ error: "This event has already started." });
      return;
    }

    const emailHash = hashEmail(email);
    const existing = await prisma.eventReminder.findUnique({
      where: { eventId_emailHash: { eventId, emailHash } },
    });
    if (existing) {
      res.status(200).json({ data: { alreadyAdded: true } });
      return;
    }

    await prisma.eventReminder.create({
      data: {
        eventId,
        emailHash,
        emailEncrypted: encryptEmail(email),
      },
    });

    res.status(201).json({ data: { alreadyAdded: false } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(200).json({ data: { alreadyAdded: true } });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Could not save that reminder. Try again." });
  }
});

/** One-click opt-out from a reminder email. */
router.get("/unsubscribe", async (req, res) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const parsed = parseReminderUnsubscribeToken(token);
    if (!parsed) {
      res.status(400).type("html").send(unsubscribePage(false, "Invalid link."));
      return;
    }

    await prisma.eventReminder.deleteMany({
      where: { eventId: parsed.eventId, emailHash: parsed.emailHash },
    });

    res.status(200).type("html").send(unsubscribePage(true));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .type("html")
      .send(unsubscribePage(false, "Something went wrong. Email hello@happenmcr.com."));
  }
});

/** Manual send of due reminders (protected). */
router.post("/send", async (req, res) => {
  if (!authorizeSend(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await runEventReminders("manual");
    res.json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Send failed",
    });
  }
});

function unsubscribePage(ok: boolean, message?: string): string {
  const title = ok ? "Reminders stopped" : "Unsubscribe";
  const body = ok
    ? "You won’t get any more reminders for that event."
    : message || "Could not unsubscribe.";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} · HappenMCR</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#111;color:#eee}main{max-width:28rem;padding:2rem;text-align:center}a{color:#ffcc00}</style>
</head><body><main>
<h1 style="font-size:1.5rem">${title}</h1>
<p style="opacity:.8;line-height:1.5">${body}</p>
<p style="margin-top:1.5rem"><a href="https://happenmcr.com">Back to HappenMCR</a></p>
</main></body></html>`;
}

export default router;
