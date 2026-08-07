import type { Event, EventSubmission } from "@prisma/client";
import { prisma } from "../../db.js";
import { notifyOrganiserOutcome } from "./organiser-notify.js";

export type ReviewResult = {
  submission: EventSubmission;
  event: Event | null;
  /** True when status changed on this call (so callers can tell if mail was queued). */
  outcomeChanged: boolean;
};

export class SubmissionReviewError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "SubmissionReviewError";
  }
}

export async function approveSubmission(
  id: string,
  reviewedBy: string,
): Promise<ReviewResult> {
  const result = await prisma.$transaction(async (tx) => {
    const submission = await tx.eventSubmission.findUnique({ where: { id } });
    if (!submission) {
      throw new SubmissionReviewError("Submission not found.", 404);
    }
    if (submission.status === "approved" && submission.publishedEventId) {
      const event = await tx.event.findUnique({
        where: { id: submission.publishedEventId },
      });
      return { submission, event, outcomeChanged: false };
    }
    if (submission.status !== "pending") {
      throw new SubmissionReviewError(
        `Submission is already ${submission.status}.`,
        409,
      );
    }

    const event = await tx.event.create({
      data: {
        title: submission.title,
        description: submission.description,
        startTime: submission.startTime,
        venueName: submission.venueName,
        ticketUrl: submission.ticketUrl,
        imageUrl: submission.promoImageUrl,
        isFree: submission.isFree,
        source: "community",
        sourceUrl: submission.ticketUrl,
        tags: [],
      },
    });

    const updated = await tx.eventSubmission.update({
      where: { id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: reviewedBy.slice(0, 120),
        publishedEventId: event.id,
      },
    });

    return { submission: updated, event, outcomeChanged: true };
  });

  if (result.outcomeChanged) {
    void notifyOrganiserOutcome({
      submission: result.submission,
      outcome: "approved",
      event: result.event,
    });
  }

  return result;
}

export async function rejectSubmission(
  id: string,
  reviewedBy: string,
): Promise<ReviewResult> {
  const submission = await prisma.eventSubmission.findUnique({ where: { id } });
  if (!submission) {
    throw new SubmissionReviewError("Submission not found.", 404);
  }
  if (submission.status === "rejected") {
    return { submission, event: null, outcomeChanged: false };
  }
  if (submission.status !== "pending") {
    throw new SubmissionReviewError(
      `Submission is already ${submission.status}.`,
      409,
    );
  }

  const updated = await prisma.eventSubmission.update({
    where: { id },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: reviewedBy.slice(0, 120),
    },
  });

  void notifyOrganiserOutcome({
    submission: updated,
    outcome: "rejected",
  });

  return { submission: updated, event: null, outcomeChanged: true };
}
