import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "../db.js";

const router: ExpressRouter = Router();

const SITE_STAT_ID = "site";
const LONDON = "Europe/London";

function londonYmd(reference = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
}

async function ensureSiteStat() {
  return prisma.siteStat.upsert({
    where: { id: SITE_STAT_ID },
    create: { id: SITE_STAT_ID, pageviews: 0 },
    update: {},
  });
}

/** @deprecated Prefer unique-visit — kept for compatibility. */
router.post("/pageview", async (_req, res) => {
  try {
    await ensureSiteStat();
    await prisma.siteStat.update({
      where: { id: SITE_STAT_ID },
      data: { pageviews: { increment: 1 } },
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record pageview" });
  }
});

/**
 * Increment today's unique-visitor count by 1.
 * Caller (Next middleware) must only invoke once per anonymous cookie per London day.
 */
router.post("/unique-visit", async (_req, res) => {
  try {
    const day = londonYmd();
    await prisma.dailyUniqueStat.upsert({
      where: { day },
      create: { day, count: 1 },
      update: { count: { increment: 1 } },
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record unique visit" });
  }
});

/** Read-only stats for the secret dashboard page. */
router.get("/visitors", async (_req, res) => {
  try {
    const day = londonYmd();
    const [stat, today, totals] = await Promise.all([
      ensureSiteStat(),
      prisma.dailyUniqueStat.findUnique({ where: { day } }),
      prisma.dailyUniqueStat.aggregate({ _sum: { count: true } }),
    ]);

    res.json({
      data: {
        day,
        uniqueToday: today?.count ?? 0,
        uniqueTotal: totals._sum.count ?? 0,
        /** Legacy raw pageview counter (no longer incremented by middleware). */
        pageviews: stat.pageviews,
        updatedAt: (today?.updatedAt ?? stat.updatedAt).toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch visitor count" });
  }
});

export default router;
