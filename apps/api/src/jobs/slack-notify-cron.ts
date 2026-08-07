import cron, { type ScheduledTask } from "node-cron";
import { isSlackConfigured } from "../services/slack/client.js";
import { retryFailedSlackSubmissionNotifies } from "../services/slack/submission-notify.js";

/** Every 5 minutes */
const DEFAULT_SCHEDULE = "*/5 * * * *";

let task: ScheduledTask | null = null;
let running = false;
let lastFinishedAt: string | null = null;
let lastError: string | null = null;

function isEnabled(): boolean {
  if (process.env.SLACK_NOTIFY_CRON_ENABLED === "false") return false;
  if (process.env.CRON_ENABLED === "false") return false;
  return isSlackConfigured();
}

function getSchedule(): string {
  return process.env.SLACK_NOTIFY_CRON_SCHEDULE?.trim() || DEFAULT_SCHEDULE;
}

export function getSlackNotifyCronStatus() {
  return {
    enabled: isEnabled() && Boolean(task),
    schedule: getSchedule(),
    running,
    lastFinishedAt,
    lastError,
  };
}

export async function runSlackNotifyRetry(
  trigger: "cron" | "manual" = "manual",
) {
  if (running) {
    throw new Error("Slack notify retry already running");
  }
  running = true;
  lastError = null;
  console.log(`[slack] notify retry started (${trigger})`);
  try {
    const result = await retryFailedSlackSubmissionNotifies();
    lastFinishedAt = new Date().toISOString();
    console.log(`[slack] notify retry finished (${trigger})`, result);
    return result;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    lastFinishedAt = new Date().toISOString();
    console.error(`[slack] notify retry failed (${trigger})`, error);
    throw error;
  } finally {
    running = false;
  }
}

export function startSlackNotifyCron(): ScheduledTask | null {
  if (!isEnabled()) {
    console.log("[slack] notify cron disabled (configure SLACK_BOT_TOKEN + channel)");
    return null;
  }

  const schedule = getSchedule();
  if (!cron.validate(schedule)) {
    console.error(`[slack] invalid cron schedule: ${schedule}`);
    return null;
  }

  task = cron.schedule(
    schedule,
    () => {
      void runSlackNotifyRetry("cron").catch(() => {
        // logged inside runner
      });
    },
    { timezone: "Europe/London" },
  );

  console.log(`[slack] notify cron scheduled (${schedule}, Europe/London)`);
  return task;
}
