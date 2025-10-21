import { createClient as createBrowserClient } from './client'
import { createClient as createServerClient } from './server'

/**
 * 현재 로그인한 사용자 가져오기 (클라이언트)
 */
export async function getCurrentUser() {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 현재 로그인한 사용자 가져오기 (서버)
 */
export async function getCurrentUserServer() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 로그인 여부 확인
 */
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}