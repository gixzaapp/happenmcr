import { Router, type Router as ExpressRouter } from "express";
import {
  getIngestionCronStatus,
  runScheduledIngestion,
} from "../jobs/ingestion-cron.js";

const router: ExpressRouter = Router();

router.get("/status", (_req, res) => {
  res.json({ data: getIngestionCronStatus() });
});

router.post("/run", async (_req, res) => {
  try {
    const result = await runScheduledIngestion("manual");
    res.json({ data: result });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Aggregation failed";
    const status = message.includes("already running") ? 409 : 500;
    res.status(status).json({ error: message });
  }
});

export default router;
