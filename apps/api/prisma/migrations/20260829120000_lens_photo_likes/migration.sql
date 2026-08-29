-- CreateTable
CREATE TABLE "lens_photo_likes" (
    "id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lens_photo_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lens_photo_likes_photo_id_user_id_key" ON "lens_photo_likes"("photo_id", "user_id");

-- CreateIndex
CREATE INDEX "lens_photo_likes_photo_id_idx" ON "lens_photo_likes"("photo_id");

-- CreateIndex
CREATE INDEX "lens_photo_likes_user_id_idx" ON "lens_photo_likes"("user_id");

-- AddForeignKey
ALTER TABLE "lens_photo_likes" ADD CONSTRAINT "lens_photo_likes_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "lens_photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lens_photo_likes" ADD CONSTRAINT "lens_photo_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
