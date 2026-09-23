import cron, { type ScheduledTask } from "node-cron";
import { sendDueEventReminders } from "../services/event-reminders/send.js";

/** Every hour at :15, Europe/London. */
const DEFAULT_SCHEDULE = "15 * * * *";

let task: ScheduledTask | null = null;
let running = false;
let lastFinishedAt: string | null = null;
let lastError: string | null = null;

function isEnabled(): boolean {
  if (process.env.EVENT_REMINDER_CRON_ENABLED === "false") return false;
  if (process.env.CRON_ENABLED === "false") return false;
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getSchedule(): string {
  return process.env.EVENT_REMINDER_CRON_SCHEDULE?.trim() || DEFAULT_SCHEDULE;
}

export function getEventReminderCronStatus() {
  return {
    enabled: isEnabled() && Boolean(task),
    schedule: getSchedule(),
    running,
    lastFinishedAt,
    lastError,
  };
}

export async function runEventReminders(trigger: "cron" | "manual" = "manual") {
  if (running) {
    throw new Error("Event reminders already sending");
  }
  running = true;
  lastError = null;
  console.log(`[event-reminders] send started (${trigger})`);
  try {
    const result = await sendDueEventReminders();
    lastFinishedAt = new Date().toISOString();
    console.log(`[event-reminders] send finished (${trigger})`, result);
    return result;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    lastFinishedAt = new Date().toISOString();
    console.error(`[event-reminders] send failed (${trigger})`, error);
    throw error;
  } finally {
    running = false;
  }
}

export function startEventReminderCron(): ScheduledTask | null {
  if (!isEnabled()) {
    console.log("[event-reminders] cron disabled (set RESEND_API_KEY to enable)");
    return null;
  }

  const schedule = getSchedule();
  if (!cron.validate(schedule)) {
    console.error(`[event-reminders] invalid cron schedule: ${schedule}`);
    return null;
  }

  task = cron.schedule(
    schedule,
    () => {
      void runEventReminders("cron").catch(() => {
        // logged inside runner
      });
    },
    { timezone: "Europe/London" },
  );

  console.log(
    `[event-reminders] cron scheduled (${schedule}, Europe/London)`,
  );
  return task;
}
