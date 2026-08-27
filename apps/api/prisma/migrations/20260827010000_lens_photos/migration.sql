-- CreateTable
CREATE TABLE "lens_photos" (
    "id" TEXT NOT NULL,
    "image_key" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lens_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lens_photos_created_at_idx" ON "lens_photos"("created_at");
