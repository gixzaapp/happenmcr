-- CreateTable
CREATE TABLE "daily_unique_stats" (
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_unique_stats_pkey" PRIMARY KEY ("day")
);
