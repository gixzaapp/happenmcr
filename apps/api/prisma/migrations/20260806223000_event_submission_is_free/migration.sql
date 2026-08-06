-- AlterTable
ALTER TABLE "event_submissions" ADD COLUMN "is_free" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "event_submissions" ALTER COLUMN "ticket_url" DROP NOT NULL;
