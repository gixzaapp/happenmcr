-- Event reminder sign-ups. Emails are stored encrypted (AES-256-GCM), not plaintext.
CREATE TABLE "event_reminders" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "email_encrypted" TEXT NOT NULL,
    "week_sent_at" TIMESTAMP(3),
    "day_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_reminders_event_id_email_hash_key" ON "event_reminders"("event_id", "email_hash");
CREATE INDEX "event_reminders_event_id_idx" ON "event_reminders"("event_id");

ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
