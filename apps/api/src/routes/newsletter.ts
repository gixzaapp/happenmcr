import type { Request } from "express";
import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "../db.js";
import { encryptEmail, hashEmail } from "../lib/newsletter-crypto.js";
import { runWeeklyNewsletter } from "../jobs/newsletter-cron.js";
import { sendWelcomeEmail } from "../services/newsletter/send.js";
import { isNewsletterSendingConfigured } from "../services/newsletter/mailer.js";
import { parseUnsubscribeToken } from "../services/newsletter/tokens.js";

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

router.post("/subscribe", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }

    const source =
      typeof req.body?.source === "string" && req.body.source.trim()
        ? req.body.source.trim().slice(0, 64)
        : "homepage";

    const emailHash = hashEmail(email);
    const emailEncrypted = encryptEmail(email);

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { emailHash },
    });

    if (existing && !existing.unsubscribedAt) {
      res.status(200).json({
        data: { alreadySubscribed: true },
      });
      return;
    }

    if (existing) {
      await prisma.newsletterSubscriber.update({
        where: { emailHash },
        data: {
          emailEncrypted,
          unsubscribedAt: null,
          source,
        },
      });
    } else {
      await prisma.newsletterSubscriber.create({
        data: {
          emailHash,
          emailEncrypted,
          source,
        },
      });
    }

    // Fire-and-forget welcome (don't fail signup if mail provider hiccups).
    void sendWelcomeEmail({ email, emailHash }).catch((error) => {
      console.error("[newsletter] welcome email failed", error);
    });

    res.status(201).json({
      data: {
        alreadySubscribed: false,
        welcomeQueued: isNewsletterSendingConfigured(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not join the list. Try again." });
  }
});

/** One-click unsubscribe from email links. */
router.get("/unsubscribe", async (req, res) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const parsed = parseUnsubscribeToken(token);
    if (!parsed) {
      res.status(400).type("html").send(unsubscribePage(false, "Invalid link."));
      return;
    }

    await prisma.newsletterSubscriber.updateMany({
      where: { emailHash: parsed.emailHash, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
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

/** Manual Thursday send (protected). */
router.post("/send-weekly", async (req, res) => {
  if (!authorizeSend(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await runWeeklyNewsletter("manual");
    res.json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Send failed",
    });
  }
});

function unsubscribePage(ok: boolean, message?: string): string {
  const title = ok ? "Unsubscribed" : "Unsubscribe";
  const body = ok
    ? "You’ve been removed from the HappenMCR newsletter."
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
