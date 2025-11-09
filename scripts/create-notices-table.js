const { PrismaClient } = require('../lib/generated/prisma')

const prisma = new PrismaClient()

async function ensureNoticesTable() {
  console.log('📢 notices 테이블 생성/업데이트를 시작합니다...')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "notices" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" VARCHAR(200) NOT NULL,
      "content" TEXT NOT NULL,
      "author_id" UUID,
      "created_at" TIMESTAMPTZ(6) DEFAULT now(),
      "updated_at" TIMESTAMPTZ(6) DEFAULT now()
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_notices_author_id"
    ON "notices"("author_id");
  `)

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'fk_notices_author_id'
          AND tc.table_name = 'notices'
      ) THEN
        ALTER TABLE "notices"
          ADD CONSTRAINT "fk_notices_author_id"
          FOREIGN KEY ("author_id")
          REFERENCES "profiles"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
      END IF;
    END $$;
  `)

  console.log('✅ notices 테이블 준비 완료!')
}

ensureNoticesTable()
  .catch((error) => {
    console.error('❌ notices 테이블 생성 실패:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

