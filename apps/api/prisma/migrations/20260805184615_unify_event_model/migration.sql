/*
  Warnings:

  - You are about to drop the column `createdAt` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `events` table. All the data in the column will be lost.
  - Added the required column `start_time` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "events_startsAt_idx";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "createdAt",
DROP COLUMN "endsAt",
DROP COLUMN "location",
DROP COLUMN "startsAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_free" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lon" DOUBLE PRECISION,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "source_url" TEXT,
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ticket_url" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "venue_address" TEXT,
ADD COLUMN     "venue_name" TEXT;

-- CreateIndex
CREATE INDEX "events_start_time_idx" ON "events"("start_time");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE INDEX "events_source_idx" ON "events"("source");
