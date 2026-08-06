-- Clear plaintext newsletter rows; emails will be re-collected encrypted.
DELETE FROM "newsletter_subscribers";

-- Drop plaintext email column and add encrypted storage columns.
ALTER TABLE "newsletter_subscribers" DROP COLUMN "email";
ALTER TABLE "newsletter_subscribers" ADD COLUMN "email_hash" TEXT NOT NULL;
ALTER TABLE "newsletter_subscribers" ADD COLUMN "email_encrypted" TEXT NOT NULL;

CREATE UNIQUE INDEX "newsletter_subscribers_email_hash_key" ON "newsletter_subscribers"("email_hash");
