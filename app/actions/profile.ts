'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/db/prisma'

type UpdateEmailResult =
  | { success: true; email: string }
  | { success: false; error: string }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function updateEmail(nextEmail: string): Promise<UpdateEmailResult> {
  const trimmedEmail = (nextEmail ?? '').trim()
  if (!trimmedEmail) {
    return { success: false, error: '이메일을 입력해주세요.' }
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { success: false, error: '올바른 이메일 형식이 아닙니다.' }
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: '세션이 만료되었습니다. 다시 로그인해주세요.' }
  }

  try {
    const metadata =
      (user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {}) ??
      {}

    // 1) Supabase Auth의 user_metadata.contact_email 업데이트
    await supabaseAdminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...metadata,
        contact_email: trimmedEmail,
      },
    })

    // 2) profiles.contact_email 컬럼도 함께 업데이트 (이중 기록)
    //    - Prisma 스키마에 없는 컬럼이므로 raw 쿼리로 업데이트
    await prisma.$executeRawUnsafe(
      `UPDATE "profiles" SET "contact_email" = $1, "updated_at" = now() WHERE "auth_id" = $2`,
      trimmedEmail,
      user.id
    )

    return { success: true, email: trimmedEmail }
  } catch (error) {
    console.error('[profile] 연락처 이메일 업데이트 실패', error)
    return { success: false, error: '이메일을 변경하는 중 오류가 발생했습니다.' }
  }
}
