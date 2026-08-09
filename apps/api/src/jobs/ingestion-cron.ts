import cron, { type ScheduledTask } from "node-cron";
import {
  runAggregation,
  type AggregationResult,
} from "../services/aggregator.js";
import { pingGoogleSitemap } from "../services/seo/ping-sitemap.js";

export type IngestionCronStatus = {
  enabled: boolean;
  schedule: string;
  running: boolean;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastResult: AggregationResult | null;
  lastError: string | null;
};

const DEFAULT_SCHEDULE = "*/10 * * * *";

let running = false;
let lastStartedAt: string | null = null;
let lastFinishedAt: string | null = null;
let lastResult: AggregationResult | null = null;
let lastError: string | null = null;
let task: ScheduledTask | null = null;

function isEnabled(): boolean {
  return process.env.CRON_ENABLED !== "false";
}

function getSchedule(): string {
  return process.env.CRON_INGEST_SCHEDULE?.trim() || DEFAULT_SCHEDULE;
}

export function getIngestionCronStatus(): IngestionCronStatus {
  return {
    enabled: isEnabled() && Boolean(task),
    schedule: getSchedule(),
    running,
    lastStartedAt,
    lastFinishedAt,
    lastResult,
    lastError,
  };
}

export async function runScheduledIngestion(
  trigger: "cron" | "startup" | "manual" = "manual",
): Promise<AggregationResult> {
  if (running) {
    throw new Error("Ingestion already running");
  }

  running = true;
  lastStartedAt = new Date().toISOString();
  lastError = null;

  console.log(`[cron] ingestion started (${trigger}) at ${lastStartedAt}`);

  try {
    const result = await runAggregation();
    lastResult = result;
    lastFinishedAt = new Date().toISOString();
    console.log(
      `[cron] ingestion finished (${trigger}) at ${lastFinishedAt}`,
      result,
    );

    // Nudge Google after successful content updates (rate-limited inside helper).
    if (result.upserted > 0) {
      void pingGoogleSitemap().catch(() => {
        /* logged inside helper */
      });
    }

    return result;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    lastFinishedAt = new Date().toISOString();
    console.error(`[cron] ingestion failed (${trigger})`, error);
    throw error;
  } finally {
    running = false;
  }
}

/** Schedule aggregator every 10 minutes (override via CRON_INGEST_SCHEDULE). */
export function startIngestionCron(): ScheduledTask | null {
  if (!isEnabled()) {
    console.log("[cron] ingestion cron disabled (CRON_ENABLED=false)");
    return null;
  }

  const schedule = getSchedule();
  if (!cron.validate(schedule)) {
    throw new Error(`Invalid CRON_INGEST_SCHEDULE: ${schedule}`);
  }

  if (task) {
    return task;
  }

  task = cron.schedule(
    schedule,
    () => {
      void runScheduledIngestion("cron").catch(() => {
        // Error already logged in runScheduledIngestion
      });
    },
    { name: "ingestion", noOverlap: true },
  );

  console.log(`[cron] ingestion scheduled: ${schedule}`);

  if (process.env.CRON_RUN_ON_START !== "false") {
    const delayMs = Number(process.env.CRON_STARTUP_DELAY_MS ?? 5_000);
    setTimeout(() => {
      void runScheduledIngestion("startup").catch(() => {
        // Error already logged
      });
    }, delayMs);
  }

  return task;
}

export function stopIngestionCron(): void {
  task?.stop();
  task = null;
}
