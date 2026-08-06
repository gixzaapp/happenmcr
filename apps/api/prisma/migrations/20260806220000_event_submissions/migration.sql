-- CreateTable
CREATE TABLE "event_submissions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "venue_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ticket_url" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_submissions_created_at_idx" ON "event_submissions"("created_at");

-- CreateIndex
CREATE INDEX "event_submissions_status_idx" ON "event_submissions"("status");
