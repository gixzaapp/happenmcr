import "dotenv/config";
import cors from "cors";
import express from "express";
import type { HealthResponse } from "@happenmcr/types";
import { prisma } from "./db.js";
import { getIngestionCronStatus, startIngestionCron } from "./jobs/ingestion-cron.js";
import {
  getNewsletterCronStatus,
  startNewsletterCron,
} from "./jobs/newsletter-cron.js";
import { localUploadsAbsoluteDir } from "./services/storage/index.js";
import eventsRouter from "./routes/events.js";
import ingestRouter from "./routes/ingest.js";
import newsletterRouter from "./routes/newsletter.js";
import statsRouter from "./routes/stats.js";
import submitEventRouter from "./routes/submit-event.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

// Local promo images — swap STORAGE_DRIVER=s3 later; this static mount is unused then.
app.use(
  "/uploads",
  express.static(localUploadsAbsoluteDir(), {
    fallthrough: true,
    maxAge: "7d",
    index: false,
  }),
);

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const cron = getIngestionCronStatus();
    const newsletter = getNewsletterCronStatus();
    const body: HealthResponse & {
      cron: {
        enabled: boolean;
        schedule: string;
        running: boolean;
        lastFinishedAt: string | null;
      };
      newsletter: {
        enabled: boolean;
        schedule: string;
        running: boolean;
        lastFinishedAt: string | null;
      };
    } = {
      status: "ok",
      service: "happenmcr-api",
      timestamp: new Date().toISOString(),
      cron: {
        enabled: cron.enabled,
        schedule: cron.schedule,
        running: cron.running,
        lastFinishedAt: cron.lastFinishedAt,
      },
      newsletter: {
        enabled: newsletter.enabled,
        schedule: newsletter.schedule,
        running: newsletter.running,
        lastFinishedAt: newsletter.lastFinishedAt,
      },
    };
    res.json(body);
  } catch {
    const body: HealthResponse = {
      status: "degraded",
      service: "happenmcr-api",
      timestamp: new Date().toISOString(),
    };
    res.status(503).json(body);
  }
});

app.use("/events", eventsRouter);
app.use("/ingest", ingestRouter);
app.use("/stats", statsRouter);
app.use("/newsletter", newsletterRouter);
app.use("/submit-event", submitEventRouter);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  startIngestionCron();
  startNewsletterCron();
});
