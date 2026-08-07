import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

export type SlackPostResult = {
  channel: string;
  ts: string;
};

export function isSlackConfigured(): boolean {
  return Boolean(
    process.env.SLACK_BOT_TOKEN?.trim() &&
      process.env.SLACK_SUBMISSIONS_CHANNEL_ID?.trim(),
  );
}

export function getSlackSigningSecret(): string | null {
  return process.env.SLACK_SIGNING_SECRET?.trim() || null;
}

export function verifySlackSignature(req: Request): boolean {
  const secret = getSlackSigningSecret();
  if (!secret) {
    console.error("[slack] SLACK_SIGNING_SECRET is not set");
    return false;
  }

  const timestamp = req.header("x-slack-request-timestamp");
  const signature = req.header("x-slack-signature");
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!timestamp || !signature) {
    console.error("[slack] missing signature headers");
    return false;
  }
  if (!rawBody?.length) {
    console.error("[slack] missing rawBody for signature check");
    return false;
  }

  const ageSec = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSec) || ageSec > 60 * 5) {
    console.error("[slack] signature timestamp too old/invalid", { ageSec });
    return false;
  }

  const base = `v0:${timestamp}:${rawBody.toString("utf8")}`;
  const digest = createHmac("sha256", secret).update(base).digest("hex");
  const expected = `v0=${digest}`;

  try {
    const ok = timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8"),
    );
    if (!ok) console.error("[slack] signature mismatch");
    return ok;
  } catch {
    console.error("[slack] signature compare failed");
    return false;
  }
}

async function slackApi<T>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  if (!token) throw new Error("SLACK_BOT_TOKEN is not set");

  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & {
    ok?: boolean;
    error?: string;
  };

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Slack ${method} failed`);
  }

  return payload;
}

export async function postSlackMessage(input: {
  channel: string;
  text: string;
  blocks: unknown[];
}): Promise<SlackPostResult> {
  const data = await slackApi<{ channel: string; ts: string }>(
    "chat.postMessage",
    {
      channel: input.channel,
      text: input.text,
      blocks: input.blocks,
    },
  );
  return { channel: data.channel, ts: data.ts };
}

export async function updateSlackMessage(input: {
  channel: string;
  ts: string;
  text: string;
  blocks: unknown[];
}): Promise<void> {
  await slackApi("chat.update", {
    channel: input.channel,
    ts: input.ts,
    text: input.text,
    blocks: input.blocks,
  });
}

/** Slack interactive response_url (no bot token needed). */
export async function postSlackResponseUrl(
  responseUrl: string,
  body: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(responseUrl, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Slack response_url failed (${response.status})`);
  }
}
