import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "../db.js";
import { encryptEmail, hashEmail } from "../lib/newsletter-crypto.js";

const router: ExpressRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
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

    res.status(201).json({
      data: { alreadySubscribed: false },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not join the list. Try again." });
  }
});

export default router;
