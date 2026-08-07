-- AlterTable
ALTER TABLE "event_submissions" ADD COLUMN "reviewed_at" TIMESTAMP(3);
ALTER TABLE "event_submissions" ADD COLUMN "reviewed_by" TEXT;
ALTER TABLE "event_submissions" ADD COLUMN "published_event_id" TEXT;
ALTER TABLE "event_submissions" ADD COLUMN "slack_channel_id" TEXT;
ALTER TABLE "event_submissions" ADD COLUMN "slack_message_ts" TEXT;
ALTER TABLE "event_submissions" ADD COLUMN "slack_notify_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "event_submissions" ADD COLUMN "slack_notify_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "event_submissions" ADD COLUMN "slack_notify_last_error" TEXT;

-- CreateIndex
CREATE INDEX "event_submissions_slack_notify_status_idx" ON "event_submissions"("slack_notify_status");
