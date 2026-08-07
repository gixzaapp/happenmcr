import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "../db.js";
import { authorizeSubmissionsAdmin } from "../lib/admin-auth.js";
import {
  approveSubmission,
  rejectSubmission,
  SubmissionReviewError,
} from "../services/submit-event/review.js";
import { refreshSlackSubmissionMessage } from "../services/slack/submission-notify.js";

const router: ExpressRouter = Router();

const ALLOWED_STATUS = new Set(["pending", "approved", "rejected"]);

router.use((req, res, next) => {
  if (!authorizeSubmissionsAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

/** GET /event-submissions?status=pending */
router.get("/", async (req, res) => {
  try {
    const statusRaw =
      typeof req.query.status === "string" ? req.query.status.trim() : "pending";
    const status = ALLOWED_STATUS.has(statusRaw) ? statusRaw : null;
    if (!status) {
      res.status(400).json({
        error: "status must be pending, approved, or rejected.",
      });
      return;
    }

    const take = Math.min(
      Number(req.query.limit) > 0 ? Number(req.query.limit) : 50,
      100,
    );

    const rows = await prisma.eventSubmission.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take,
    });

    res.json({ data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not list submissions." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.eventSubmission.findUnique({
      where: { id: req.params.id },
    });
    if (!row) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    res.json({ data: row });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load submission." });
  }
});

/**
 * PATCH /event-submissions/:id
 * body: { action: "approve" | "reject", reviewedBy?: string }
 */
router.patch("/:id", async (req, res) => {
  try {
    const action =
      typeof req.body?.action === "string"
        ? req.body.action.trim().toLowerCase()
        : "";
    const reviewedBy =
      typeof req.body?.reviewedBy === "string" && req.body.reviewedBy.trim()
        ? req.body.reviewedBy.trim()
        : "admin-api";

    if (action !== "approve" && action !== "reject") {
      res.status(400).json({ error: 'action must be "approve" or "reject".' });
      return;
    }

    const result =
      action === "approve"
        ? await approveSubmission(req.params.id, reviewedBy)
        : await rejectSubmission(req.params.id, reviewedBy);

    void refreshSlackSubmissionMessage(
      result.submission,
      action === "approve" ? "approved" : "rejected",
      reviewedBy,
    ).catch((error) => {
      console.error("[slack] message refresh failed", error);
    });

    res.json({
      data: {
        submission: result.submission,
        event: result.event,
      },
    });
  } catch (error) {
    if (error instanceof SubmissionReviewError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Could not update submission." });
  }
});

export default router;
