const { PrismaClient } = require('../lib/generated/prisma')

const prisma = new PrismaClient()

async function ensureNotificationsTable() {
  console.log('🔔 notifications 테이블 생성/업데이트를 시작합니다...')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "notifications" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "profile_id" UUID NOT NULL,
      "title" VARCHAR(200) NOT NULL,
      "message" TEXT,
      "type" VARCHAR(20) NOT NULL,
      "read" BOOLEAN NOT NULL DEFAULT FALSE,
      "read_at" TIMESTAMPTZ(6),
      "created_at" TIMESTAMPTZ(6) DEFAULT now()
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_notifications_profile_id"
    ON "notifications"("profile_id");
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_notifications_profile_read"
    ON "notifications"("profile_id", "read");
  `)

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'fk_notifications_profile_id'
          AND tc.table_name = 'notifications'
      ) THEN
        ALTER TABLE "notifications"
          ADD CONSTRAINT "fk_notifications_profile_id"
          FOREIGN KEY ("profile_id")
          REFERENCES "profiles"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
      END IF;
    END $$;
  `)

  console.log('✅ notifications 테이블 준비 완료!')
}

ensureNotificationsTable()
  .catch((error) => {
    console.error('❌ notifications 테이블 생성 실패:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

