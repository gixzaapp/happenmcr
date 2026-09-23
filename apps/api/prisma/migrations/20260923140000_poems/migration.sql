CREATE TABLE "poems" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "excerpt" TEXT,
    "place" TEXT,
    "dedication" TEXT,
    "image_key" TEXT,
    "image_url" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poems_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "poem_likes" (
    "id" TEXT NOT NULL,
    "poem_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poem_likes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "poems_created_at_idx" ON "poems"("created_at");
CREATE INDEX "poems_user_id_idx" ON "poems"("user_id");
CREATE UNIQUE INDEX "poem_likes_poem_id_user_id_key" ON "poem_likes"("poem_id", "user_id");
CREATE INDEX "poem_likes_poem_id_idx" ON "poem_likes"("poem_id");
CREATE INDEX "poem_likes_user_id_idx" ON "poem_likes"("user_id");

ALTER TABLE "poems" ADD CONSTRAINT "poems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "poem_likes" ADD CONSTRAINT "poem_likes_poem_id_fkey" FOREIGN KEY ("poem_id") REFERENCES "poems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poem_likes" ADD CONSTRAINT "poem_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
