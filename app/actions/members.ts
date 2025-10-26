'use server'

import { createClient } from '@/lib/supabase/server'

// ==================== 타입 정의 ====================

interface ConvertToMemberResult {
  success: boolean
  error?: string
}

// ==================== 회원 승격 (비회원 → 정회원) ====================

/**
 * 비회원을 정회원으로 승격
 * - members 테이블의 type을 'member'로 변경
 * - status를 'active'로 변경
 * - profile의 role도 'member'로 업데이트
 * - user_permissions에 회원 권한 부여
 */
export async function convertToMember(memberPhone: string): Promise<ConvertToMemberResult> {
  try {
    const supabase = await createClient()

    // 1. members 테이블 업데이트 (type = 'member', status = 'active')
    const { error: memberError } = await supabase
      .from('members')
      .update({
        type: 'member',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('phone', memberPhone)

    if (memberError) {
      console.error('회원 타입 업데이트 실패:', memberError)
      return {
        success: false,
        error: '회원 정보 업데이트에 실패했습니다'
      }
    }

    // 2. profile_id 가져오기
    const { data: member, error: getMemberError } = await supabase
      .from('members')
      .select('profile_id')
      .eq('phone', memberPhone)
      .single()

    if (getMemberError || !member) {
      console.error('회원 조회 실패:', getMemberError)
      return {
        success: false,
        error: '회원 정보를 찾을 수 없습니다'
      }
    }

    // 3. profiles 테이블 업데이트 (role = 'member')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'member',
        updated_at: new Date().toISOString()
      })
      .eq('id', member.profile_id)

    if (profileError) {
      console.error('프로필 업데이트 실패:', profileError)
      // 프로필 업데이트 실패해도 회원 전환은 성공으로 처리
    }

    // 4. user_permissions 확인 및 생성/업데이트
    const { data: existingPermission } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('phone', memberPhone)
      .single()

    if (existingPermission) {
      // 기존 권한이 있으면 업데이트
      const { error: permissionError } = await supabase
        .from('user_permissions')
        .update({
          menu_dashboard: true,
          menu_attendance: true,
          menu_members: false,
          menu_classes: false,
          menu_settlements: false,
          menu_settings: true,
          updated_at: new Date().toISOString()
        })
        .eq('phone', memberPhone)

      if (permissionError) {
        console.error('권한 업데이트 실패:', permissionError)
      }
    } else {
      // 권한이 없으면 생성
      const { error: permissionError } = await supabase
        .from('user_permissions')
        .insert({
          phone: memberPhone,
          menu_dashboard: true,
          menu_attendance: true,
          menu_members: false,
          menu_classes: false,
          menu_settlements: false,
          menu_settings: true
        })

      if (permissionError) {
        console.error('권한 생성 실패:', permissionError)
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('회원 전환 중 오류:', error)
    return {
      success: false,
      error: '회원 전환 중 오류가 발생했습니다'
    }
  }
}
