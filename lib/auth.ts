/**
 * 인증 관련 헬퍼 함수
 * 전화번호를 아이디로 사용
 */
import { createClient } from './supabase/client'
import { phoneToEmail, normalizePhone } from './utils/phone'

/**
 * 전화번호로 회원가입
 */
export async function signUpWithPhone(
  phone: string,
  password: string,
  name: string
) {
  const supabase = createClient()
  const email = phoneToEmail(phone)
  const normalizedPhone = normalizePhone(phone)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone: normalizedPhone,
        name: name
      }
    }
  })
  
  if (error) return { data: null, error }
  
  // profiles 테이블에 추가 정보 저장 (나중에 DB 만들면 활성화)
  // if (data.user) {
  //   await supabase.from('profiles').insert({
  //     id: data.user.id,
  //     phone: normalizedPhone,
  //     name: name,
  //     role: 'member'
  //   })
  // }
  
  return { data, error: null }
}

/**
 * 전화번호로 로그인
 */
export async function signInWithPhone(
  phone: string,
  password: string
) {
  const supabase = createClient()
  const email = phoneToEmail(phone)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  return { data, error }
}

/**
 * 로그아웃
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * 현재 로그인한 사용자 정보
 */
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * 비밀번호 변경
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { data, error }
}