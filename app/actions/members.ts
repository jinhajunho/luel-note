'use server'

import { createClient } from '@/lib/supabase/server'

// ==================== 타입 정의 ====================

interface ConvertToMemberResult {
  success: boolean
  error?: string
}

interface SetRoleResult {
  success: boolean
  error?: string
}

interface ResetPasswordResult {
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

// ==================== 권한 설정 ====================

/**
 * 회원 권한(role) 설정
 * - profiles.role 업데이트
 * - user_permissions 자동 설정
 */
export async function setMemberRole(
  memberPhone: string,
  role: 'member' | 'instructor' | 'admin'
): Promise<SetRoleResult> {
  try {
    const supabase = await createClient()

    // 1. profile_id 가져오기
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

    // 2. profiles 테이블 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', member.profile_id)

    if (profileError) {
      console.error('프로필 업데이트 실패:', profileError)
      return {
        success: false,
        error: '권한 설정에 실패했습니다'
      }
    }

    // 3. 역할별 권한 설정
    const permissions = {
      member: {
        menu_dashboard: true,
        menu_attendance: true,
        menu_members: false,
        menu_classes: false,
        menu_settlements: false,
        menu_settings: true
      },
      instructor: {
        menu_dashboard: true,
        menu_attendance: true,
        menu_members: true,
        menu_classes: true,
        menu_settlements: true,
        menu_settings: true
      },
      admin: {
        menu_dashboard: true,
        menu_attendance: true,
        menu_members: true,
        menu_classes: true,
        menu_settlements: true,
        menu_settings: true
      }
    }

    // 4. user_permissions 확인 및 업데이트/생성
    const { data: existingPermission } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('phone', memberPhone)
      .single()

    if (existingPermission) {
      // 업데이트
      const { error: permissionError } = await supabase
        .from('user_permissions')
        .update({
          ...permissions[role],
          updated_at: new Date().toISOString()
        })
        .eq('phone', memberPhone)

      if (permissionError) {
        console.error('권한 업데이트 실패:', permissionError)
      }
    } else {
      // 생성
      const { error: permissionError } = await supabase
        .from('user_permissions')
        .insert({
          phone: memberPhone,
          ...permissions[role]
        })

      if (permissionError) {
        console.error('권한 생성 실패:', permissionError)
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('권한 설정 중 오류:', error)
    return {
      success: false,
      error: '권한 설정 중 오류가 발생했습니다'
    }
  }
}

// ==================== 비밀번호 초기화 ====================

/**
 * 관리자용 비밀번호 초기화
 * - 비밀번호를 전화번호로 초기화
 * - Supabase Admin API 사용
 */
export async function resetMemberPassword(memberPhone: string): Promise<ResetPasswordResult> {
  try {
    const supabase = await createClient()

    // 1. auth_id 가져오기
    const { data: profile, error: getProfileError } = await supabase
      .from('profiles')
      .select('auth_id')
      .eq('phone', memberPhone)
      .single()

    if (getProfileError || !profile) {
      console.error('프로필 조회 실패:', getProfileError)
      return {
        success: false,
        error: '회원 정보를 찾을 수 없습니다'
      }
    }

    // 2. Supabase Admin API로 비밀번호 초기화
    // 초기 비밀번호: 전화번호 (하이픈 제거)
    const initialPassword = memberPhone.replace(/-/g, '')

    // TODO: Supabase Admin API 설정 필요
    // 현재는 서버 환경에서 실행되므로 Admin API를 사용할 수 있습니다
    // 하지만 SUPABASE_SERVICE_ROLE_KEY가 환경변수에 있어야 합니다

    const adminAuthClient = supabase.auth.admin

    const { error: updateError } = await adminAuthClient.updateUserById(
      profile.auth_id,
      {
        password: initialPassword
      }
    )

    if (updateError) {
      console.error('비밀번호 초기화 실패:', updateError)
      return {
        success: false,
        error: '비밀번호 초기화에 실패했습니다'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('비밀번호 초기화 중 오류:', error)
    return {
      success: false,
      error: '비밀번호 초기화 중 오류가 발생했습니다'
    }
  }
}
