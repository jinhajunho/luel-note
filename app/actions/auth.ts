'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type ActionState = {
  error?: string
  success?: boolean
} | undefined

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
  const email = `${phone}@luelnote.app`

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { error: '로그인에 실패했습니다. 전화번호와 비밀번호를 확인하세요.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

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
  const email = `${phone}@luelnote.app`

  // 1. Auth 사용자 생성만 (심플하게!)
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

  // 2. profiles 수동 추가
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      phone,
      auth_id: data.user.id,
      name,
      role: 'member',
      birth_date: birth_date || null,
      gender: gender || null
    })

  if (profileError) {
    console.error('프로필 오류:', profileError)
    return { error: `프로필 생성 실패: ${profileError.message}` }
  }

  // 3. members 수동 추가
  const { error: memberError } = await supabase
    .from('members')
    .insert({
      id: phone,
      name,
      is_guest: true,
      status: 'guest',
      join_date: new Date().toISOString().split('T')[0]
    })

  if (memberError) {
    console.error('회원 오류:', memberError)
    // 에러 무시
  }

  // 4. permissions 수동 추가
  const { error: permError } = await supabase
    .from('user_permissions')
    .insert({
      user_phone: phone,
      menu_dashboard: true,
      menu_attendance: true,
      menu_members: false,
      menu_classes: false,
      menu_settlements: false,
      menu_settings: true
    })

  if (permError) {
    console.error('권한 오류:', permError)
    // 에러 무시
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}