import { Router, type Router as ExpressRouter, type Request } from "express";
import {
  approveSubmission,
  rejectSubmission,
  SubmissionReviewError,
} from "../services/submit-event/review.js";
import {
  postSlackResponseUrl,
  verifySlackSignature,
} from "../services/slack/client.js";
import { buildSubmissionBlocks } from "../services/slack/submission-notify.js";

const router: ExpressRouter = Router();

type SlackActionPayload = {
  type?: string;
  user?: { id?: string; username?: string; name?: string };
  response_url?: string;
  actions?: Array<{ action_id?: string; value?: string }>;
};

function reviewerLabel(payload: SlackActionPayload): string {
  return (
    payload.user?.username ||
    payload.user?.name ||
    payload.user?.id ||
    "slack"
  );
}

router.post("/interactions", async (req, res) => {
  try {
    if (!verifySlackSignature(req)) {
      res.status(401).send("invalid signature");
      return;
    }

    const rawPayload =
      typeof req.body?.payload === "string" ? req.body.payload : "";
    if (!rawPayload) {
      res.status(400).send("missing payload");
      return;
    }

    const payload = JSON.parse(rawPayload) as SlackActionPayload;
    if (payload.type !== "block_actions") {
      res.status(200).send("");
      return;
    }

    const action = payload.actions?.[0];
    const submissionId = action?.value?.trim();
    const actionId = action?.action_id;
    if (!submissionId || !actionId) {
      res.status(200).send("");
      return;
    }

    // Acknowledge quickly; do work then update via response_url.
    res.status(200).send("");

    const reviewedBy = `slack:${reviewerLabel(payload)}`;
    let state: "approved" | "rejected";
    let result;

    try {
      if (actionId === "submission_approve") {
        result = await approveSubmission(submissionId, reviewedBy);
        state = "approved";
      } else if (actionId === "submission_reject") {
        result = await rejectSubmission(submissionId, reviewedBy);
        state = "rejected";
      } else {
        return;
      }
    } catch (error) {
      const message =
        error instanceof SubmissionReviewError
          ? error.message
          : "Could not update submission.";
      if (payload.response_url) {
        await postSlackResponseUrl(payload.response_url, {
          replace_original: true,
          text: `Could not process submission: ${message}`,
        });
      }
      console.error("[slack] interaction failed", error);
      return;
    }

    const { text, blocks } = buildSubmissionBlocks(
      result.submission,
      state,
      reviewedBy,
    );

    if (payload.response_url) {
      await postSlackResponseUrl(payload.response_url, {
        replace_original: true,
        text,
        blocks,
      });
    }

    console.info(
      `[slack] submission ${state} id=${submissionId} by=${reviewedBy}`,
    );
  } catch (error) {
    console.error("[slack] interactions error", error);
    if (!res.headersSent) {
      res.status(500).send("error");
    }
  }
});

export default router;

export type SlackRawBodyRequest = Request & { rawBody?: Buffer };
