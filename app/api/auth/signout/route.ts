import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut().catch((error) => {
    console.warn('[auth] 로그아웃 처리 실패', error)
  })
  return NextResponse.json({ success: true })
}

