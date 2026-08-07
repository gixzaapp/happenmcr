import { Router, type Router as ExpressRouter, type Request } from "express";
import {
  approveSubmission,
  rejectSubmission,
  SubmissionReviewError,
} from "../services/submit-event/review.js";
import { verifySlackSignature } from "../services/slack/client.js";
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
    console.info("[slack] interaction received");

    if (!verifySlackSignature(req)) {
      res.status(401).send("invalid signature");
      return;
    }

    const rawPayload =
      typeof req.body?.payload === "string" ? req.body.payload : "";
    if (!rawPayload) {
      console.error("[slack] missing payload field");
      res.status(400).send("missing payload");
      return;
    }

    const payload = JSON.parse(rawPayload) as SlackActionPayload;
    if (payload.type !== "block_actions") {
      res.status(200).json({});
      return;
    }

    const action = payload.actions?.[0];
    const submissionId = action?.value?.trim();
    const actionId = action?.action_id;
    if (!submissionId || !actionId) {
      res.status(200).json({});
      return;
    }

    const reviewedBy = `slack:${reviewerLabel(payload)}`;

    try {
      let state: "approved" | "rejected";
      let result;

      if (actionId === "submission_approve") {
        result = await approveSubmission(submissionId, reviewedBy);
        state = "approved";
      } else if (actionId === "submission_reject") {
        result = await rejectSubmission(submissionId, reviewedBy);
        state = "rejected";
      } else {
        res.status(200).json({});
        return;
      }

      const { text, blocks } = buildSubmissionBlocks(
        result.submission,
        state,
        reviewedBy,
      );

      // Return the updated message in the ack (Slack replaces the original).
      res.status(200).json({
        replace_original: true,
        text,
        blocks,
      });

      console.info(
        `[slack] submission ${state} id=${submissionId} by=${reviewedBy}`,
      );
    } catch (error) {
      const message =
        error instanceof SubmissionReviewError
          ? error.message
          : "Could not update submission.";
      console.error("[slack] interaction failed", error);
      res.status(200).json({
        replace_original: false,
        text: `Could not process submission: ${message}`,
        response_type: "ephemeral",
      });
    }
  } catch (error) {
    console.error("[slack] interactions error", error);
    if (!res.headersSent) {
      res.status(500).send("error");
    }
  }
});

export default router;

export type SlackRawBodyRequest = Request & { rawBody?: Buffer };
