-- AlterTable
ALTER TABLE "events" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'scheduled';

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");
