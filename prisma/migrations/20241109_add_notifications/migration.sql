-- notifications 테이블 생성
CREATE TABLE "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "message" TEXT,
  "type" VARCHAR(20) NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  "read_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) DEFAULT now()
);

CREATE INDEX "idx_notifications_profile_id" ON "notifications"("profile_id");
CREATE INDEX "idx_notifications_profile_read" ON "notifications"("profile_id", "read");

ALTER TABLE "notifications"
  ADD CONSTRAINT "fk_notifications_profile_id"
  FOREIGN KEY ("profile_id")
  REFERENCES "profiles"("id")
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

