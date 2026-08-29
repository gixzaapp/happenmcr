-- AlterTable
ALTER TABLE "lens_photos" ADD COLUMN "user_id" TEXT,
ADD COLUMN "uploader_name" TEXT,
ADD COLUMN "uploader_image" TEXT;

-- CreateIndex
CREATE INDEX "lens_photos_user_id_idx" ON "lens_photos"("user_id");

-- AddForeignKey
ALTER TABLE "lens_photos" ADD CONSTRAINT "lens_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
