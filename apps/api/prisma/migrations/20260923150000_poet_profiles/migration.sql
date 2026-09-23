CREATE TABLE "poet_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "image_key" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poet_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "poet_profiles_user_id_key" ON "poet_profiles"("user_id");

ALTER TABLE "poet_profiles" ADD CONSTRAINT "poet_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
