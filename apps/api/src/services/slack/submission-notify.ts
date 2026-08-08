import type { EventSubmission } from "@prisma/client";
import { prisma } from "../../db.js";
import {
  isSlackConfigured,
  postSlackMessage,
  updateSlackMessage,
} from "./client.js";

const MAX_ATTEMPTS = 5;

function formatWhen(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "full",
    timeStyle: "short",
  });
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function buildSubmissionBlocks(
  submission: EventSubmission,
  state: "pending" | "approved" | "rejected" = "pending",
  reviewer?: string,
): { text: string; blocks: unknown[] } {
  const when = formatWhen(submission.startTime);
  const pricing = submission.isFree ? "Free" : "Paid";
  const statusLine =
    state === "pending"
      ? "Needs review"
      : state === "approved"
        ? `Approved${reviewer ? ` by ${reviewer}` : ""} · published to site`
        : `Rejected${reviewer ? ` by ${reviewer}` : ""}`;

  const text = `Event submission: ${submission.title} (${statusLine})`;

  const fields = [
    { type: "mrkdwn", text: `*When*\n${when}` },
    { type: "mrkdwn", text: `*Venue*\n${submission.venueName}` },
    { type: "mrkdwn", text: `*Category*\n${submission.category}` },
    { type: "mrkdwn", text: `*Pricing*\n${pricing}` },
    { type: "mrkdwn", text: `*Contact*\n${submission.contactEmail}` },
  ];

  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text:
          state === "pending"
            ? "New event submission"
            : state === "approved"
              ? "Submission approved"
              : "Submission rejected",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${submission.title}*\n${truncate(submission.description, 500)}`,
      },
    },
    { type: "section", fields },
  ];

  if (submission.ticketUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Link*\n<${submission.ticketUrl}|Open event / tickets>`,
      },
    });
  }

  if (submission.promoImageUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Promo image*\n<${submission.promoImageUrl}|View image>`,
      },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `ID \`${submission.id}\` · ${statusLine}`,
      },
    ],
  });

  if (state === "pending") {
    blocks.push({
      type: "actions",
      block_id: `submission_actions_${submission.id}`,
      elements: [
        {
          type: "button",
          action_id: "submission_approve",
          style: "primary",
          text: { type: "plain_text", text: "Approve" },
          value: submission.id,
          confirm: {
            title: { type: "plain_text", text: "Approve submission?" },
            text: {
              type: "plain_text",
              text: "This will publish the event on HappenMCR.",
            },
            confirm: { type: "plain_text", text: "Approve" },
            deny: { type: "plain_text", text: "Cancel" },
          },
        },
        {
          type: "button",
          action_id: "submission_reject",
          style: "danger",
          text: { type: "plain_text", text: "Reject" },
          value: submission.id,
          confirm: {
            title: { type: "plain_text", text: "Reject submission?" },
            text: {
              type: "plain_text",
              text: "The organiser will not be published.",
            },
            confirm: { type: "plain_text", text: "Reject" },
            deny: { type: "plain_text", text: "Cancel" },
          },
        },
      ],
    });
  }

  return { text, blocks };
}

/** Post (or skip) Slack notice for one submission. Safe to call repeatedly. */
export async function notifySubmissionOnSlack(
  submissionId: string,
): Promise<"sent" | "skipped" | "failed"> {
  const submission = await prisma.eventSubmission.findUnique({
    where: { id: submissionId },
  });
  if (!submission) return "failed";

  if (submission.slackNotifyStatus === "sent" && submission.slackMessageTs) {
    return "sent";
  }

  if (submission.status !== "pending") {
    await prisma.eventSubmission.update({
      where: { id: submissionId },
      data: { slackNotifyStatus: "skipped" },
    });
    return "skipped";
  }

  if (!isSlackConfigured()) {
    await prisma.eventSubmission.update({
      where: { id: submissionId },
      data: {
        slackNotifyStatus: "skipped",
        slackNotifyLastError: "Slack not configured",
      },
    });
    return "skipped";
  }

  const channel = process.env.SLACK_SUBMISSIONS_CHANNEL_ID!.trim();
  const { text, blocks } = buildSubmissionBlocks(submission, "pending");

  try {
    const posted = await postSlackMessage({ channel, text, blocks });
    await prisma.eventSubmission.update({
      where: { id: submissionId },
      data: {
        slackChannelId: posted.channel,
        slackMessageTs: posted.ts,
        slackNotifyStatus: "sent",
        slackNotifyAttempts: { increment: 1 },
        slackNotifyLastError: null,
      },
    });
    console.info(
      `[slack] submission notify sent id=${submissionId} ts=${posted.ts}`,
    );
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.eventSubmission.update({
      where: { id: submissionId },
      data: {
        slackNotifyStatus: "failed",
        slackNotifyAttempts: { increment: 1 },
        slackNotifyLastError: message.slice(0, 500),
      },
    });
    console.error(`[slack] submission notify failed id=${submissionId}`, error);
    return "failed";
  }
}

export async function refreshSlackSubmissionMessage(
  submission: EventSubmission,
  state: "approved" | "rejected",
  reviewer: string,
): Promise<void> {
  if (!submission.slackChannelId || !submission.slackMessageTs) return;
  if (!isSlackConfigured()) return;

  const { text, blocks } = buildSubmissionBlocks(submission, state, reviewer);
  await updateSlackMessage({
    channel: submission.slackChannelId,
    ts: submission.slackMessageTs,
    text,
    blocks,
  });
}

/** Retry pending/failed Slack notifies (background cron). */
export async function retryFailedSlackSubmissionNotifies(): Promise<{
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  if (!isSlackConfigured()) {
    return { attempted: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const rows = await prisma.eventSubmission.findMany({
    where: {
      status: "pending",
      slackNotifyStatus: { in: ["pending", "failed"] },
      slackNotifyAttempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const result = await notifySubmissionOnSlack(row.id);
    if (result === "sent") sent += 1;
    else if (result === "failed") failed += 1;
    else skipped += 1;
  }

  return { attempted: rows.length, sent, failed, skipped };
}
