'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { phoneToEmail } from '@/lib/auth-helpers'

type ActionState = {
  error?: string
  success?: boolean
} | undefined

// ==================== 로그인 ====================

export async function login(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  if (!phone || !password) {
    return { error: '전화번호와 비밀번호를 입력하세요.' }
  }

  const supabase = await createClient()
  const email = phoneToEmail(phone)

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { error: '로그인에 실패했습니다. 전화번호와 비밀번호를 확인하세요.' }
  }

  revalidatePath('/', 'layout')
  
  // 권한 확인 후 리다이렉트
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('phone', phone)
    .single()

  if (!profile || !profile.role) {
    redirect('/pending')
  }

  // 역할별 기본 페이지로 이동
  redirect(`/${profile.role}/schedule`)
}

// ==================== 회원가입 ====================

export async function signup(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const phone = formData.get('phone') as string
  const name = formData.get('name') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const birth_date = formData.get('birth_date') as string
  const gender = formData.get('gender') as string

  // 검증
  if (!phone || !name || !password || !confirmPassword) {
    return { error: '필수 항목을 모두 입력하세요.' }
  }

  if (password !== confirmPassword) {
    return { error: '비밀번호가 일치하지 않습니다.' }
  }

  if (password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' }
  }

  if (!/^\d{10,11}$/.test(phone)) {
    return { error: '올바른 전화번호 형식이 아닙니다.' }
  }

  const supabase = await createClient()
  const email = phoneToEmail(phone)

  // 1. Auth 사용자 생성
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    console.error('가입 오류:', error)
    return { error: `가입 실패: ${error.message}` }
  }

  if (!data.user) {
    return { error: '사용자 생성 실패' }
  }

  // 2. profiles 테이블에 추가 (role = null, 승인 대기)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      auth_id: data.user.id,
      phone,
      name,
      role: null, // 관리자 승인 대기
      birth_date: birth_date || null,
      gender: gender || null
    })

  if (profileError) {
    console.error('프로필 오류:', profileError)
    return { error: `프로필 생성 실패: ${profileError.message}` }
  }

  // 3. members 테이블에 추가 (type = 'guest', status = 'active')
  const { error: memberError } = await supabase
    .from('members')
    .insert({
      phone,
      profile_id: data.user.id,
      name,
      type: 'guest',
      status: 'active',
      join_date: new Date().toISOString().split('T')[0]
    })

  if (memberError) {
    console.error('회원 오류:', memberError)
    // 에러 무시 (선택적)
  }

  return { success: true }
}

// ==================== 로그아웃 ====================

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
