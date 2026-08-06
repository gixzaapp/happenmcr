import cron, { type ScheduledTask } from "node-cron";
import { sendWeeklyNewsletter } from "../services/newsletter/send.js";

/** Thursday 08:00 Europe/London */
const DEFAULT_SCHEDULE = "0 8 * * 4";

let task: ScheduledTask | null = null;
let running = false;
let lastFinishedAt: string | null = null;
let lastError: string | null = null;

function isEnabled(): boolean {
  if (process.env.NEWSLETTER_CRON_ENABLED === "false") return false;
  if (process.env.CRON_ENABLED === "false") return false;
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getSchedule(): string {
  return process.env.NEWSLETTER_CRON_SCHEDULE?.trim() || DEFAULT_SCHEDULE;
}

export function getNewsletterCronStatus() {
  return {
    enabled: isEnabled() && Boolean(task),
    schedule: getSchedule(),
    running,
    lastFinishedAt,
    lastError,
  };
}

export async function runWeeklyNewsletter(
  trigger: "cron" | "manual" = "manual",
) {
  if (running) {
    throw new Error("Weekly newsletter already sending");
  }
  running = true;
  lastError = null;
  console.log(`[newsletter] weekly send started (${trigger})`);
  try {
    const result = await sendWeeklyNewsletter();
    lastFinishedAt = new Date().toISOString();
    console.log(`[newsletter] weekly send finished (${trigger})`, result);
    return result;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    lastFinishedAt = new Date().toISOString();
    console.error(`[newsletter] weekly send failed (${trigger})`, error);
    throw error;
  } finally {
    running = false;
  }
}

export function startNewsletterCron(): ScheduledTask | null {
  if (!isEnabled()) {
    console.log("[newsletter] cron disabled (set RESEND_API_KEY to enable)");
    return null;
  }

  const schedule = getSchedule();
  if (!cron.validate(schedule)) {
    console.error(`[newsletter] invalid cron schedule: ${schedule}`);
    return null;
  }

  task = cron.schedule(
    schedule,
    () => {
      void runWeeklyNewsletter("cron").catch(() => {
        // logged inside runner
      });
    },
    { timezone: "Europe/London" },
  );

  console.log(
    `[newsletter] cron scheduled (${schedule}, Europe/London)`,
  );
  return task;
}
