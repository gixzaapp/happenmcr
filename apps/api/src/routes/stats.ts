import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "../db.js";

const router: ExpressRouter = Router();

const SITE_STAT_ID = "site";

async function ensureSiteStat() {
  return prisma.siteStat.upsert({
    where: { id: SITE_STAT_ID },
    create: { id: SITE_STAT_ID, pageviews: 0 },
    update: {},
  });
}

/** Increment total page views by 1. */
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

/** Read-only visitor/pageview total (for the secret dashboard page). */
router.get("/visitors", async (_req, res) => {
  try {
    const stat = await ensureSiteStat();
    res.json({
      data: {
        pageviews: stat.pageviews,
        updatedAt: stat.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch visitor count" });
  }
});

export default router;
