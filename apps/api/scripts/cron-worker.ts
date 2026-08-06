import "dotenv/config";
import {
  getIngestionCronStatus,
  startIngestionCron,
} from "../src/jobs/ingestion-cron.js";

startIngestionCron();
console.log("[cron-worker] running", getIngestionCronStatus());

// Keep process alive for scheduled jobs.
setInterval(() => {
  // heartbeat no-op
}, 60_000);
